"""
Chunk-size tuning experiment for the book-lens RAG pipeline.

실제 챗봇이 사용하는 chunk_text / get_embeddings / search 모듈을 그대로
import 해서, (chunk_size × top_k) 조합별 검색 정확도·속도를 비교합니다.

설계 원칙
---------
* 운영 DB 기존 데이터 무변경: 임시 Book/BookContent/Chunk 를 생성 후
  실험이 끝나면 반드시 savepoint_rollback 으로 원상복구합니다.
* BookContent 는 OneToOneField 이므로 실제 Book 을 재사용하지 않고
  "[EXPERIMENT]" 접두사의 임시 Book 을 별도 생성합니다.
* BGE-M3 모델은 스크립트 시작 시 한 번만 로드합니다 (singleton).
* 동일 질문 임베딩은 chunk_size 루프 진입 전에 한 번만 계산합니다.

Usage
-----
  # Management command (권장):
  cd backend
  BGE_M3_DEVICE=cpu python manage.py run_chunk_experiment

  # Standalone script:
  cd backend
  BGE_M3_DEVICE=cpu python scripts/chunk_tuning_experiment.py
"""

from __future__ import annotations

import csv
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Django bootstrap — standalone 실행 시에만 호출
# ---------------------------------------------------------------------------

def _setup_django() -> None:
    base = Path(__file__).resolve().parent.parent
    sys.path.insert(0, str(base))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
    import django
    django.setup()


# ---------------------------------------------------------------------------
# 실험 설정
# ---------------------------------------------------------------------------

CHUNK_SIZES: list[int] = [500, 900, 1500]
TOP_K_VALUES: list[int] = [3, 5, 10]
CHUNK_OVERLAP_RATIO: float = 0.15   # overlap_chars = chunk_size * 0.15

# book_title 키 → 질문 목록
# expected_keywords 중 하나라도 retrieved chunk 전체 텍스트에 포함되면 "hit"
BOOK_QUERIES: dict[str, list[dict[str, Any]]] = {
    "어린왕자": [
        {
            "query": "어린왕자가 사막에서 만난 동물은?",
            "expected_keywords": ["여우", "뱀"],
        },
        {
            "query": "장미꽃과 어린왕자의 관계는?",
            "expected_keywords": ["장미", "사랑", "소중"],
        },
        {
            "query": "어린왕자가 방문한 별에는 누가 살고 있었나?",
            "expected_keywords": ["왕", "허영쟁이", "사업가", "술꾼", "가로등지기"],
        },
        {
            "query": "여우가 어린왕자에게 가르쳐 준 것은 무엇인가?",
            "expected_keywords": ["길들이", "책임"],
        },
        {
            "query": "보아뱀이 삼킨 것은 무엇인가?",
            "expected_keywords": ["코끼리", "모자"],
        },
    ],
}

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "experiments"
OUTPUT_CSV = OUTPUT_DIR / "chunk_tuning_result.csv"


# ---------------------------------------------------------------------------
# 결과 데이터 클래스
# ---------------------------------------------------------------------------

@dataclass
class ExperimentRow:
    book_title: str
    chunk_size: int
    overlap: int
    top_k: int
    chunk_count: int
    accuracy: float       # hit rate  0.0 ~ 1.0
    avg_time_ms: float    # 질문당 평균 검색 소요 시간


# ---------------------------------------------------------------------------
# 롤백 sentinel — atomic() 블록을 강제로 ROLLBACK 시키는 내부 예외
# ---------------------------------------------------------------------------

class _ForceRollback(Exception):
    """임시 실험 데이터를 DB에 남기지 않기 위해 atomic() 블록을 강제 롤백하는 sentinel."""


# ---------------------------------------------------------------------------
# 메인 실험 루프
# ---------------------------------------------------------------------------

def run(stdout=None) -> list[ExperimentRow]:
    """전체 실험 실행 후 정확도 내림차순 정렬된 결과를 반환합니다."""
    import django.db.transaction as tx
    from books.models import Book, BookContent, BookContentChunk
    from books.chunking import chunk_text
    from books.embeddings import get_embedding_model, get_embeddings

    # ── BGE-M3 워밍업 (singleton — 이후 재로드 없음) ─────────────────────
    _log(stdout, "BGE-M3 모델 로드 중 (최초 1회)...")
    get_embedding_model()
    _log(stdout, "모델 로드 완료.\n")

    rows: list[ExperimentRow] = []

    for book_title, queries in BOOK_QUERIES.items():

        # ── 1. DB에서 책 + 본문 조회 ──────────────────────────────────────
        try:
            book = Book.objects.select_related("content").get(title=book_title)
        except Book.DoesNotExist:
            _log(stdout, f"[SKIP] '{book_title}' 이 DB에 없습니다. 건너뜁니다.\n")
            continue

        if not hasattr(book, "content") or not book.content.content.strip():
            _log(stdout, f"[SKIP] '{book_title}' 의 BookContent 가 비어 있습니다.\n")
            continue

        raw_text: str = book.content.content
        _log(stdout, f"=== 책: {book_title}  |  본문 {len(raw_text):,}자 ===")

        # ── 2. 질문 임베딩 — chunk_size 루프 바깥에서 한 번만 계산 ────────
        query_texts = [q["query"] for q in queries]
        _log(stdout, f"  질문 {len(query_texts)}개 임베딩 계산 중 (1회)...")
        query_embeddings = get_embeddings(query_texts)
        _log(stdout, "  질문 임베딩 완료.\n")

        # ── 3. chunk_size 루프 ────────────────────────────────────────────
        for chunk_size in CHUNK_SIZES:
            overlap = int(chunk_size * CHUNK_OVERLAP_RATIO)
            _log(stdout, f"  ▸ chunk_size={chunk_size}  overlap={overlap}")

            # 청킹
            text_chunks = chunk_text(raw_text, max_chars=chunk_size, overlap_chars=overlap)
            if not text_chunks:
                _log(stdout, "    → 청크 0개. 건너뜁니다.\n")
                continue

            # 청크 임베딩 (배치)
            chunk_contents = [tc.content for tc in text_chunks]
            t0 = time.perf_counter()
            chunk_embeddings = get_embeddings(chunk_contents)
            emb_ms = (time.perf_counter() - t0) * 1000
            _log(stdout, f"    → 청크 {len(text_chunks)}개 생성  |  임베딩 {emb_ms:.0f}ms")

            # ── 4. atomic(): 임시 Book/BookContent/Chunk 생성 ─────────────
            #    BookContent 는 OneToOneField → 임시 Book 을 별도 생성합니다.
            #    atomic 블록 마지막에 _ForceRollback 을 발생시켜 ROLLBACK.
            #    결과(rows 리스트)는 Python 메모리에 이미 누적되어 있어 안전합니다.
            try:
                with tx.atomic():
                    tmp_book = Book.objects.create(
                        title=f"[EXPERIMENT] {book_title} cs={chunk_size}",
                        author="_experiment_",
                        publisher="_experiment_",
                        description="",
                    )
                    tmp_content = BookContent.objects.create(
                        book=tmp_book,
                        content=raw_text,
                        embed_status="experiment",
                    )
                    BookContentChunk.objects.bulk_create([
                        BookContentChunk(
                            book_content=tmp_content,
                            chunk_index=tc.chunk_index,
                            content=tc.content,
                            embedding=emb,
                            embed_status="completed",
                        )
                        for tc, emb in zip(text_chunks, chunk_embeddings)
                    ])

                    # ── 5. top_k 루프: 임시 청크만 대상으로 검색 ──────────
                    for top_k in TOP_K_VALUES:
                        hits = 0
                        times_ms: list[float] = []

                        for q, q_emb in zip(queries, query_embeddings):
                            t_search = time.perf_counter()
                            results = _search_within(
                                embedding=q_emb,
                                book_content_id=tmp_content.id,
                                limit=top_k,
                            )
                            times_ms.append((time.perf_counter() - t_search) * 1000)

                            # 6. hit 판정: retrieved chunk 전체 텍스트에 키워드 포함 여부
                            retrieved_text = " ".join(r.chunk.content for r in results)
                            if _keyword_hit(retrieved_text, q["expected_keywords"]):
                                hits += 1

                        accuracy = hits / len(queries)
                        avg_ms = sum(times_ms) / len(times_ms)

                        rows.append(ExperimentRow(
                            book_title=book_title,
                            chunk_size=chunk_size,
                            overlap=overlap,
                            top_k=top_k,
                            chunk_count=len(text_chunks),
                            accuracy=accuracy,
                            avg_time_ms=avg_ms,
                        ))
                        _log(
                            stdout,
                            f"      top_k={top_k:>2}  →  {hits}/{len(queries)} hit"
                            f"  ({accuracy:.0%})  avg {avg_ms:.1f}ms",
                        )

                    # 7. 임시 데이터 ROLLBACK — 운영 DB 무변경 보장
                    raise _ForceRollback()

            except _ForceRollback:
                pass  # 예상된 롤백 — 정상 흐름

            _log(stdout, "")

        _log(stdout, "")

    # ── 8. 정확도 내림차순, 속도 오름차순 정렬 ───────────────────────────
    rows.sort(key=lambda r: (-r.accuracy, r.avg_time_ms))
    return rows


# ---------------------------------------------------------------------------
# 내부 헬퍼
# ---------------------------------------------------------------------------

def _search_within(
    *,
    embedding: list[float],
    book_content_id: int,
    limit: int,
):
    """search_book_content_chunks_by_embedding 과 동일 로직이되
    book_content_id 로 범위를 제한해 임시 청크만 검색합니다."""
    from pgvector.django import CosineDistance
    from books.models import BookContentChunk
    from books.search import ChunkSearchResult

    qs = (
        BookContentChunk.objects
        .select_related("book_content__book")
        .filter(book_content_id=book_content_id, embedding__isnull=False)
        .annotate(distance=CosineDistance("embedding", embedding))
        .order_by("distance", "id")
    )[:limit]
    return [ChunkSearchResult(chunk=c, distance=float(c.distance)) for c in qs]


def _keyword_hit(text: str, keywords: list[str]) -> bool:
    """키워드 중 하나라도 text 에 포함되면 True."""
    return any(kw in text for kw in keywords)


def _log(stdout: Any, msg: str) -> None:
    """management command stdout / print 양쪽을 투명하게 처리."""
    if stdout is not None:
        stdout.write(msg + "\n")
    else:
        print(msg)


# ---------------------------------------------------------------------------
# 출력 / 저장 헬퍼
# ---------------------------------------------------------------------------

def print_table(rows: list[ExperimentRow], stdout: Any = None) -> None:
    """결과를 콘솔에 표 형태로 출력합니다."""
    if not rows:
        _log(stdout, "결과 없음.")
        return

    col = f"{'책':^10}  {'chunk_size':>10}  {'overlap':>7}  " \
          f"{'top_k':>5}  {'chunks':>6}  {'accuracy':>9}  {'avg_ms':>8}"
    sep = "─" * len(col)
    _log(stdout, "\n" + sep)
    _log(stdout, col)
    _log(stdout, sep)
    for r in rows:
        _log(
            stdout,
            f"{r.book_title:^10}  {r.chunk_size:>10}  {r.overlap:>7}  "
            f"{r.top_k:>5}  {r.chunk_count:>6}  {r.accuracy:>8.0%}  {r.avg_time_ms:>8.1f}",
        )
    _log(stdout, sep + "\n")


def save_csv(rows: list[ExperimentRow]) -> Path:
    """결과를 backend/experiments/chunk_tuning_result.csv 로 저장합니다."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "book_title", "chunk_size", "overlap", "top_k",
                "chunk_count", "accuracy", "avg_time_ms",
            ],
        )
        writer.writeheader()
        for r in rows:
            writer.writerow({
                "book_title": r.book_title,
                "chunk_size": r.chunk_size,
                "overlap": r.overlap,
                "top_k": r.top_k,
                "chunk_count": r.chunk_count,
                "accuracy": f"{r.accuracy:.4f}",
                "avg_time_ms": f"{r.avg_time_ms:.2f}",
            })
    return OUTPUT_CSV


# ---------------------------------------------------------------------------
# Standalone 진입점
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    _setup_django()
    result_rows = run()
    print_table(result_rows)
    csv_path = save_csv(result_rows)
    print(f"결과 저장: {csv_path}")
