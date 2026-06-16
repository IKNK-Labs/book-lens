"use client";

import { useEffect, useState } from "react";
import type { Book } from "../../data/mock";
import { mockGenreFilters } from "../../data/mock";
import { booksApi, type BookResponse } from "../../lib/api";
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Book Lens"
        title="동화 찾기"
        description={
          isMember
            ? "저장한 취향을 바탕으로 오늘 이어가기 좋은 동화를 찾아보세요."
            : "궁금한 동화를 찾아보고, 마음에 드는 이야기는 상세 화면에서 더 살펴보세요."
        }
      />
      <Card>
        <label className="block text-sm font-black text-[var(--accent-strong)]" htmlFor="book-search">
          동화 검색
        </label>
        <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted)]">
          <input
            id="book-search"
            className="w-full bg-transparent outline-none placeholder:text-[var(--muted)]"
            placeholder="백설공주, 신데렐라, 어린왕자..."
            aria-label="동화 검색어"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
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
