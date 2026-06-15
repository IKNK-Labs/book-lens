import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { Card } from "../../../components/ui/Card";
import { Chip } from "../../../components/ui/Chip";
import { mockBooks, mockCharacters } from "../../../data/mock";
import { getViewer } from "../../../lib/mockAuth";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auth?: string }>;
};

export default async function BookDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, authParams] = await Promise.all([params, searchParams]);
  const viewer = getViewer(authParams);
  const book = mockBooks.find((item) => item.id === id);

  if (!book) notFound();

  const characters = mockCharacters.filter((character) => character.bookTitle === book.title);
  const storyHref = `/story/${book.id}?auth=member`;

  return (
    <AppShell viewer={viewer}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[36px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)] sm:p-10">
          <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-start">
            <div className="grid h-40 place-items-center rounded-[32px] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--accent-soft)] to-[var(--surface-muted)] text-7xl">{book.coverEmoji}</div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">{book.label} · {book.readingTime}</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[var(--accent-strong)] sm:text-4xl">{book.title}</h1>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">{book.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {book.genres.map((genre) => <Chip key={genre}>{genre}</Chip>)}
                <Chip>대화 가능 캐릭터 {book.characterCount}명</Chip>
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card className="shadow-none">
              <h2 className="text-lg font-black text-[var(--accent-strong)]">줄거리</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{book.description}</p>
            </Card>
            <Card className="shadow-none">
              <h2 className="text-lg font-black text-[var(--accent-strong)]">이런 사용자에게 추천</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{book.recommendedFor}</p>
            </Card>
          </div>
        </section>

        <aside className="grid gap-5 self-start">
          <Card>
            <h2 className="text-lg font-black text-[var(--accent-strong)]">시작하기</h2>
            <div className="mt-4 grid gap-3">
              {viewer.isMember ? (
                <>
                  <Link href={storyHref} className="rounded-full bg-[var(--accent)] px-5 py-3 text-center text-sm font-black text-white">동화 구연 시작</Link>
                  <Link href="/chat?auth=member" className="rounded-full border border-[var(--line)] px-5 py-3 text-center text-sm font-black text-[var(--accent-strong)]">캐릭터와 대화</Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="rounded-full bg-[var(--accent)] px-5 py-3 text-center text-sm font-black text-white">로그인하고 구연 시작</Link>
                  <Link href="/login" className="rounded-full border border-[var(--line)] px-5 py-3 text-center text-sm font-black text-[var(--accent-strong)]">로그인하고 대화</Link>
                </>
              )}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-black text-[var(--accent-strong)]">등장 캐릭터</h2>
            <div className="mt-4 grid gap-3">
              {characters.map((character) => (
                <div key={character.id} className="rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{character.avatarEmoji}</span>
                    <div>
                      <p className="font-black text-[var(--foreground)]">{character.name}</p>
                      <p className="text-xs font-bold text-[var(--muted)]">{character.role}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{character.shortBio}</p>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
