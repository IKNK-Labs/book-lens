import { mockBooks, mockGenreFilters } from "../../data/mock";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { SectionHeader } from "../ui/SectionHeader";
import { BookCard } from "./BookCard";

export function BookSearchShell() {
  // TODO: GET /api/books/search 연결 예정
  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Book search"
        title="동화 찾기"
        description="대화할 동화를 고르고, 이야기 속 캐릭터와 이어지는 채팅 화면으로 이동합니다. 현재는 mock 데이터 기반 화면 shell입니다."
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
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {mockGenreFilters.map((filter, index) => (
            <Chip key={filter} active={index === 0}>
              {filter}
            </Chip>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
