import { mockBooks, mockGenreFilters } from "../../data/mock";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { SectionHeader } from "../ui/SectionHeader";
import { BookCard } from "./BookCard";

export function BookSearchShell({ isMember = false, isPreview = false }: { isMember?: boolean; isPreview?: boolean }) {
  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Book Lens"
        title="동화 찾기"
        description={isMember ? "저장한 취향을 바탕으로 오늘 이어가기 좋은 동화를 찾아보세요." : "궁금한 동화를 찾아보고, 마음에 드는 이야기는 상세 화면에서 더 살펴보세요."}
      />
      <Card>
        <label className="block text-sm font-black text-[var(--accent-strong)]" htmlFor="book-search">
          동화 검색
        </label>
        <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted)]">
          <input id="book-search" className="w-full bg-transparent outline-none placeholder:text-[var(--muted)]" placeholder="백설공주, 신데렐라, 어린왕자..." aria-label="동화 검색어" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {mockGenreFilters.map((filter, index) => (
            <Chip key={filter} interactive active={index === 0}>
              {filter}
            </Chip>
          ))}
        </div>
      </Card>
      {isMember ? <p className="rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4 text-sm font-bold text-[var(--accent-strong)]">최근 대화와 관심 주제를 참고해 추천 순서를 보여드려요.</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockBooks.map((book) => (
          <BookCard key={book.id} book={book} isMember={isMember} isPreview={isPreview} />
        ))}
      </div>
    </div>
  );
}
