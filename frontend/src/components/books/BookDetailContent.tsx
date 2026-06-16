"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, booksApi, type BookResponse } from "../../lib/api";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";

export function BookDetailContent({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<BookResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadBook() {
      setIsLoading(true);
      setError("");
      try {
        const item = await booksApi.detail(Number(bookId));
        if (isCurrent) setBook(item);
      } catch (err) {
        if (!isCurrent) return;
        if (err instanceof ApiError && err.status === 404) {
          setError("도서를 찾을 수 없습니다.");
        } else {
          setError("도서 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadBook();

    return () => {
      isCurrent = false;
    };
  }, [bookId]);

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm font-bold text-[var(--accent-strong)]">도서 정보를 불러오는 중입니다.</p>
      </Card>
    );
  }

  if (error || !book) {
    return (
      <Card>
        <h1 className="text-2xl font-black text-[var(--accent-strong)]">도서 상세</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{error || "도서 정보를 찾을 수 없습니다."}</p>
      </Card>
    );
  }

  const content = book.content?.content;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[36px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)] sm:p-10">
        <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-start">
          <div className="grid h-40 place-items-center rounded-[32px] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--accent-soft)] to-[var(--surface-muted)] text-7xl">
            📖
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              {book.publisher} · ISBN {book.isbn}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[var(--accent-strong)] sm:text-4xl">
              {book.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">{book.description || "등록된 소개가 없습니다."}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Chip>{book.author}</Chip>
              <Chip>대화 가능 캐릭터 {book.character_count ?? 0}명</Chip>
            </div>
          </div>
        </div>
        {content ? (
          <Card className="mt-8 shadow-none">
            <h2 className="text-lg font-black text-[var(--accent-strong)]">본문</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{content}</p>
          </Card>
        ) : null}
      </section>

      <aside className="self-start">
        <Card>
          <h2 className="text-lg font-black text-[var(--accent-strong)]">이 책으로 시작하기</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            동화 구연으로 이야기를 듣고, 등장 캐릭터와 대화를 이어가 보세요.
          </p>
          <Link
            href={`/story/${book.id}`}
            className="mt-5 block rounded-full bg-[var(--accent)] px-5 py-3 text-center text-sm font-black text-white"
          >
            동화 구연 시작하기
          </Link>
          {book.featured_character_id ? (
            <Link
              href={`/chat/${book.featured_character_id}`}
              className="mt-3 block rounded-full border border-[var(--line)] px-5 py-3 text-center text-sm font-black text-[var(--accent-strong)]"
            >
              대표 캐릭터와 대화하기
            </Link>
          ) : (
            <p className="mt-3 rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold text-[var(--muted)]">
              대화 가능한 캐릭터가 등록되면 캐릭터 대화가 열립니다.
            </p>
          )}
        </Card>

        <Card className="mt-4">
          <h2 className="text-lg font-black text-[var(--accent-strong)]">도서 정보</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="font-black text-[var(--accent-strong)]">저자</dt>
              <dd className="mt-1 text-[var(--muted)]">{book.author}</dd>
            </div>
            <div>
              <dt className="font-black text-[var(--accent-strong)]">출판사</dt>
              <dd className="mt-1 text-[var(--muted)]">{book.publisher}</dd>
            </div>
            <div>
              <dt className="font-black text-[var(--accent-strong)]">ISBN</dt>
              <dd className="mt-1 text-[var(--muted)]">{book.isbn}</dd>
            </div>
          </dl>
        </Card>
      </aside>
    </div>
  );
}
