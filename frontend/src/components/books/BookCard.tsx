import Link from "next/link";
import type { Book } from "../../data/mock";
import { Chip } from "../ui/Chip";

export function BookCard({ book }: { book: Book }) {
  return (
    <article className="flex h-full flex-col rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]">
      <div className="mb-4 grid h-28 place-items-center rounded-[22px] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--accent-soft)] to-[var(--surface-muted)] text-5xl">
        {book.coverEmoji}
      </div>
      <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--foreground)]">{book.title}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">{book.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {book.genres.map((genre) => (
          <Chip key={genre}>{genre}</Chip>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
        <span className="text-xs font-bold text-[var(--muted)]">대화 가능 캐릭터 {book.characterCount}명</span>
        <Link
          href={`/chat/${book.featuredCharacterId}`}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-black text-white"
        >
          캐릭터 보기
        </Link>
      </div>
    </article>
  );
}
