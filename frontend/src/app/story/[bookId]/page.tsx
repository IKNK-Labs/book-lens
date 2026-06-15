import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { Card } from "../../../components/ui/Card";
import { mockBooks, mockStoryScenesByBookId } from "../../../data/mock";
import { getViewer } from "../../../lib/mockAuth";

type PageProps = { params: Promise<{ bookId: string }>; searchParams: Promise<{ auth?: string }> };

export default async function StoryPage({ params, searchParams }: PageProps) {
  const [{ bookId }, authParams] = await Promise.all([params, searchParams]);
  const viewer = getViewer(authParams);
  if (!viewer.isMember) {
    redirect(`/login?message=${encodeURIComponent("동화 구연을 시작하려면 로그인이 필요합니다.")}`);
  }

  const book = mockBooks.find((item) => item.id === bookId);
  if (!book) notFound();
  const scenes = mockStoryScenesByBookId[book.id] ?? [];
  const currentScene = scenes[0];

  return (
    <AppShell viewer={viewer}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-[36px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">동화 구연</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[var(--accent-strong)]">{book.title}</h1>
          <Card className="mt-6 shadow-none">
            <div className="mb-5 grid min-h-52 place-items-center rounded-[30px] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--accent-soft)] to-[var(--surface-muted)] text-7xl">{book.coverEmoji}</div>
            <p className="text-sm font-black text-[var(--accent)]">장면 1 / {Math.max(scenes.length, 1)}</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[var(--foreground)]">{currentScene?.title ?? "첫 장면"}</h2>
            <p className="mt-4 text-base leading-8 text-[var(--muted)]">{currentScene?.narration ?? book.summary}</p>
            <blockquote className="mt-5 rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] p-5 text-sm font-bold leading-7 text-[var(--accent-strong)]">
              “{currentScene?.dialogue ?? "이야기를 천천히 들어볼까요?"}”
            </blockquote>
          </Card>
          <div className="mt-5 flex flex-wrap justify-between gap-3">
            <button type="button" className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-black text-[var(--muted)]">이전 장면</button>
            <button type="button" className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-black text-white">다음 장면</button>
          </div>
        </section>
        <aside className="self-start">
          <Card>
            <h2 className="text-lg font-black text-[var(--accent-strong)]">장면 속 캐릭터</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{currentScene?.characterName ?? "캐릭터"}와 방금 장면에 대해 이야기해 보세요.</p>
            <Link href={`/chat/${currentScene?.characterId ?? book.featuredCharacterId}?auth=member`} className="mt-5 block rounded-full bg-[var(--accent)] px-5 py-3 text-center text-sm font-black text-white">이 장면의 캐릭터와 대화</Link>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
