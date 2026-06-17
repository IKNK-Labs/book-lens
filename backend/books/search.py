"""pgvector search helpers for finding relevant book content chunks."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.db.models import QuerySet
from pgvector.django import CosineDistance

from .embeddings import BGE_M3_EMBEDDING_DIMENSIONS, get_embedding
from .models import BookContentChunk


DEFAULT_VECTOR_SEARCH_LIMIT = 10


@dataclass(frozen=True)
class ChunkSearchResult:
    chunk: BookContentChunk
    distance: float


class VectorSearchError(ValueError):
    """Raised when a vector search request is invalid."""


def search_book_content_chunks(
    query: str,
    *,
    limit: int = DEFAULT_VECTOR_SEARCH_LIMIT,
    embedding_func=get_embedding,
) -> list[ChunkSearchResult]:
    _validate_limit(limit)
    query_embedding = embedding_func(query)
    return search_book_content_chunks_by_embedding(query_embedding, limit=limit)


def search_book_content_chunks_by_embedding(
    query_embedding: list[float],
    *,
    limit: int = DEFAULT_VECTOR_SEARCH_LIMIT,
) -> list[ChunkSearchResult]:
    _validate_limit(limit)
    _validate_embedding(query_embedding)

    queryset = _chunk_search_queryset(query_embedding)[:limit]
    return [
        ChunkSearchResult(chunk=chunk, distance=float(chunk.distance))
        for chunk in queryset
    ]


def _chunk_search_queryset(query_embedding: list[float]) -> QuerySet[BookContentChunk]:
    return (
        BookContentChunk.objects.select_related("book_content__book")
        .filter(embedding__isnull=False)
        .annotate(distance=CosineDistance("embedding", query_embedding))
        .order_by("distance", "id")
    )


def _validate_limit(limit: int) -> None:
    if limit <= 0:
        raise VectorSearchError("limit must be greater than 0")


def _validate_embedding(query_embedding: list[float]) -> None:
    if len(query_embedding) != BGE_M3_EMBEDDING_DIMENSIONS:
        raise VectorSearchError(
            f"expected {BGE_M3_EMBEDDING_DIMENSIONS} dimensions, got {len(query_embedding)}"
        )
    for value in query_embedding:
        _coerce_float(value)


def _coerce_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise VectorSearchError("embedding values must be numeric") from exc
