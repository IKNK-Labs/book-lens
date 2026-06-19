"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { Book } from "../../data/mock";
import { mockGenreFilters } from "../../data/mock";
import { booksApi, type BookVectorSearchResult } from "../../lib/api";
import { toCardBook } from "../../lib/books/format";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { SectionHeader } from "../ui/SectionHeader";
import { BookCard } from "./BookCard";

const BOOKS_PER_PAGE = 8;

function formatSimilarity(distance: number) {
  const score = Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
  return `${score}%`;
}

export function BookSearchShell({
  isMember = false,
  isPreview = false,
  initialSearch = "",
}: {
  isMember?: boolean;
  isPreview?: boolean;
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [books, setBooks] = useState<Book[]>([]);
  const [vectorResults, setVectorResults] = useState<BookVectorSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVectorLoading, setIsVectorLoading] = useState(false);
  const [error, setError] = useState("");
  const [vectorError, setVectorError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(books.length / BOOKS_PER_PAGE));
  const effectivePage = Math.min(currentPage, totalPages);
  const pagedBooks = useMemo(() => {
    const start = (effectivePage - 1) * BOOKS_PER_PAGE;
    return books.slice(start, start + BOOKS_PER_PAGE);
  }, [books, effectivePage]);

  useEffect(() => {
    let isCurrent = true;

    async function loadBooks() {
      setIsLoading(true);
      setError("");
      try {
        const items = await booksApi.list(search);
        if (isCurrent) setBooks(items.map(toCardBook));
      } catch {
        if (isCurrent) setError("도서 목록을 불러오지 못했습니다.");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadBooks();

    return () => {
      isCurrent = false;
    };
  }, [search]);

  async function handleVectorSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();

    if (!query) {
      setVectorResults([]);
      setVectorError("검색어를 입력해 주세요.");
      return;
    }

    setIsVectorLoading(true);
    setVectorError("");
    try {
      const data = await booksApi.vectorSearch(query, 8);
      setVectorResults(data.results);
    } catch {
      setVectorError("의미 검색 결과를 불러오지 못했습니다.");
      setVectorResults([]);
    } finally {
      setIsVectorLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Book Lens"
        title="동화 찾기"
        description={
          isMember
            ? "등록된 동화에서 오늘 읽기 좋은 이야기를 찾아보세요."
            : "궁금한 동화를 찾아보고, 마음에 드는 이야기는 상세 화면에서 둘러보세요."
        }
      />
      <Card>
        <label className="block text-sm font-black text-[var(--accent-strong)]" htmlFor="book-search">
          동화 검색
        </label>
        <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={handleVectorSearch}>
          <div className="min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted)]">
            <input
              id="book-search"
              className="w-full bg-transparent outline-none placeholder:text-[var(--muted)]"
              placeholder="미녀와 야수, 모험, 용기..."
              aria-label="동화 검색어"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-black text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isVectorLoading}
          >
            {isVectorLoading ? "검색 중" : "내용 검색"}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {mockGenreFilters.map((filter, index) => (
            <Chip key={filter} interactive active={index === 0}>
              {filter}
            </Chip>
          ))}
        </div>
      </Card>
      {isMember ? (
        <p className="rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4 text-sm font-bold text-[var(--accent-strong)]">
          저장한 설정은 대화 경험에만 반영되며, 도서 목록은 현재 등록된 데이터를 보여줍니다.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4 text-sm font-bold text-[var(--accent-strong)]">
          {error}
        </p>
      ) : null}
      {vectorError ? (
        <p className="rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4 text-sm font-bold text-[var(--accent-strong)]">
          {vectorError}
        </p>
      ) : null}
      {vectorResults.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-base font-black text-[var(--foreground)]">내용 검색 결과</h2>
          <div className="grid gap-3">
            {vectorResults.map((result) => (
              <Link
                key={result.chunk_id}
                href={`/books/${result.book_id}${isPreview ? "?auth=member" : ""}`}
                className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-[var(--accent-strong)]">{result.title}</p>
                  <span className="text-xs font-bold text-[var(--muted)]">
                    유사도 {formatSimilarity(result.distance)}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                  {result.author} · {result.publisher}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                  {result.content}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {isLoading ? (
        <p className="rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4 text-sm font-bold text-[var(--accent-strong)]">
          도서 목록을 불러오는 중입니다.
        </p>
      ) : books.length > 0 ? (
        <section className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pagedBooks.map((book) => (
              <BookCard key={book.id} book={book} isMember={isMember} isPreview={isPreview} />
            ))}
          </div>
          {totalPages > 1 ? (
            <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="도서 목록 페이지">
              <button
                type="button"
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-black text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={effectivePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                이전
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-black transition ${
                    effectivePage === page
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--line)] text-[var(--accent-strong)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                  aria-current={effectivePage === page ? "page" : undefined}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-black text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={effectivePage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                다음
              </button>
            </nav>
          ) : null}
        </section>
      ) : (
        <p className="rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4 text-sm font-bold text-[var(--accent-strong)]">
          조건에 맞는 동화가 없습니다.
        </p>
      )}
    </div>
  );
}
