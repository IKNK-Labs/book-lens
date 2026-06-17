"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import type { Book } from "../../data/mock";
import { mockGenreFilters } from "../../data/mock";
import { booksApi, type BookResponse, type BookVectorSearchResult } from "../../lib/api";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { SectionHeader } from "../ui/SectionHeader";
import { BookCard } from "./BookCard";

function toCardBook(book: BookResponse): Book {
  const description = book.description || book.content?.content || "등록된 소개가 없습니다.";

  return {
    id: String(book.id),
    title: book.title,
    description,
    coverEmoji: "📖",
    characterCount: book.character_count ?? 0,
    genres: [book.publisher || "도서"],
    featuredCharacterId: "",
    summary: description,
    recommendedFor: "등록된 도서 상세를 확인해 보세요.",
    readingTime: "상세 보기",
    label: book.author,
  };
}

export function BookSearchShell({
  isMember = false,
  isPreview = false,
}: {
  isMember?: boolean;
  isPreview?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [vectorResults, setVectorResults] = useState<BookVectorSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVectorLoading, setIsVectorLoading] = useState(false);
  const [error, setError] = useState("");
  const [vectorError, setVectorError] = useState("");

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
            ? "저장한 취향을 바탕으로 오늘 읽기 좋은 동화를 찾아보세요."
            : "궁금한 동화를 찾아보고, 마음에 드는 이야기는 상세 화면에서 더 살펴보세요."
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
              placeholder="백설공주, 신데렐라, 용감한 모험..."
              aria-label="동화 검색어"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-black text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isVectorLoading}
          >
            {isVectorLoading ? "검색 중" : "의미 검색"}
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
          최근 저장한 관심 주제를 참고해 추천 도서를 보여드려요.
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
          <h2 className="text-base font-black text-[var(--foreground)]">의미 검색 결과</h2>
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
                    거리 {result.distance.toFixed(4)}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                  {result.author} · {result.publisher} · chunk {result.chunk_index + 1}
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} isMember={isMember} isPreview={isPreview} />
          ))}
        </div>
      )}
    </div>
  );
}
