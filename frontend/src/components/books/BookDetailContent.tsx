"use client";

import { useEffect, useState } from "react";
import { ApiError, booksApi, type BookResponse } from "../../lib/api";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";

type BookInfoItem = {
  label: string;
  value: string;
};

type BookDetailViewModel = {
  id: string;
  title: string;
  description: string;
  coverEmoji: string;
  genres: string[];
  characterCount: number;
  characterNotice: string;
  content?: string;
  infoItems: BookInfoItem[];
};

function isPositiveIntegerId(value: string) {
  return /^[1-9]\d*$/.test(value);
}

function compactInfoItems(items: Array<BookInfoItem | null>) {
  return items.filter((item): item is BookInfoItem => Boolean(item?.value.trim()));
}

function toDetailViewModelFromApiBook(book: BookResponse): BookDetailViewModel {
  const description = book.description || "등록된 소개가 없습니다.";
  const content = book.content?.content;
  const characterCount = book.character_count ?? 0;

  return {
    id: String(book.id),
    title: book.title,
    description,
    coverEmoji: "📖",
    genres: [book.publisher || "도서"],
    characterCount,
    characterNotice:
      characterCount > 0
        ? "대화 가능한 캐릭터가 등록되어 있습니다. 캐릭터 대화 연결은 준비 중입니다."
        : "이 도서의 캐릭터 정보는 아직 준비 중입니다.",
    content: content || undefined,
    infoItems: compactInfoItems([
      { label: "저자", value: book.author },
      { label: "출판사", value: book.publisher },
      { label: "ISBN", value: book.isbn ?? "" },
    ]),
  };
}

export function BookDetailContent({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<BookDetailViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadBook() {
      setIsLoading(true);
      setError("");
      setBook(null);

      if (!isPositiveIntegerId(bookId)) {
        if (isCurrent) {
          setError("도서를 찾을 수 없습니다.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const item = await booksApi.detail(Number(bookId));
        if (isCurrent) setBook(toDetailViewModelFromApiBook(item));
      } catch (err) {
        if (!isCurrent) return;
        if (err instanceof ApiError && err.status === 404) {
          setError("도서를 찾을 수 없습니다.");
        } else {
          setError("도서 정보를 불러오지 못했습니다.\n잠시 후 다시 시도해 주세요.");
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
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
          {error || "도서를 찾을 수 없습니다."}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[36px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)] sm:p-10">
        <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-start">
          <div className="grid h-40 place-items-center rounded-[32px] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--accent-soft)] to-[var(--surface-muted)] text-7xl">
            {book.coverEmoji}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              {book.genres.join(" · ")}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[var(--accent-strong)] sm:text-4xl">
              {book.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">{book.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {book.genres.map((genre) => (
                <Chip key={genre}>{genre}</Chip>
              ))}
              <Chip>대화 가능 캐릭터 {book.characterCount}명</Chip>
            </div>
          </div>
        </div>
        {book.content ? (
          <Card className="mt-8 shadow-none">
            <h2 className="text-lg font-black text-[var(--accent-strong)]">본문</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{book.content}</p>
          </Card>
        ) : null}
      </section>

      <aside className="self-start">
        <Card>
          <h2 className="text-lg font-black text-[var(--accent-strong)]">이 책으로 시작하기</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            동화 구연과 캐릭터 대화 기능은 준비 중입니다.
          </p>
          <p className="mt-5 rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold text-[var(--muted)]">
            {book.characterNotice}
          </p>
        </Card>

        {book.infoItems.length ? (
          <Card className="mt-4">
            <h2 className="text-lg font-black text-[var(--accent-strong)]">도서 정보</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              {book.infoItems.map((item) => (
                <div key={item.label}>
                  <dt className="font-black text-[var(--accent-strong)]">{item.label}</dt>
                  <dd className="mt-1 text-[var(--muted)]">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}
