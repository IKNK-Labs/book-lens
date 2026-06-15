import Link from "next/link";
import { AppShell } from "../../components/layout/AppShell";
import { Card } from "../../components/ui/Card";
import { mockConversationSessions, mockMessagesByCharacterId } from "../../data/mock";
import { getViewer } from "../../lib/mockAuth";

type ChatPageProps = { searchParams: Promise<{ auth?: string }> };

function ConversationCard({ session }: { session: (typeof mockConversationSessions)[number] }) {
  return (
    <article className="grid gap-3 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div>
        <h3 className="text-base font-black leading-6 tracking-[-0.04em] text-[var(--foreground)] sm:text-lg">{session.title}</h3>
        <p className="mt-1 text-xs font-bold text-[var(--accent-strong)]">{session.bookTitle} · {session.characterName}</p>
      </div>
      <p className="line-clamp-2 text-sm leading-6 text-[var(--muted)]">{session.lastMessage}</p>
      <div className="flex items-end justify-between gap-3">
        <p className="text-xs font-bold text-[var(--muted)]">{session.updatedAt} / {session.saved ? "저장됨" : "임시 대화"}</p>
        <Link href={`/chat/${session.characterId}?auth=member`} className="shrink-0 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-black text-white">이어하기</Link>
      </div>
    </article>
  );
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const viewer = getViewer(await searchParams);
  const selected = mockConversationSessions[0];
  const messages = mockMessagesByCharacterId[selected.characterId] ?? [];

  return (
    <AppShell viewer={viewer}>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="hidden self-start lg:grid lg:gap-4">
          <Card>
            <h1 className="text-2xl font-black tracking-[-0.06em] text-[var(--accent-strong)]">내 대화</h1>
            <div className="mt-4 flex gap-2">
              <input className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none" placeholder="대화 검색" aria-label="대화 검색" />
              <button type="button" className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-black text-white">검색</button>
            </div>
          </Card>
          {mockConversationSessions.map((session) => <ConversationCard key={session.id} session={session} />)}
        </aside>

        <details className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-soft)] p-3 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl px-2 py-2 font-black text-[var(--accent-strong)] [&::-webkit-details-marker]:hidden">
            <span>내 대화</span>
            <span aria-hidden="true">▾▴</span>
          </summary>
          <div className="mt-3 grid gap-3">
            <div className="flex gap-2">
              <input className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none" placeholder="대화 검색" aria-label="모바일 대화 검색" />
              <button type="button" className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-black text-white">검색</button>
            </div>
            {mockConversationSessions.map((session) => <ConversationCard key={session.id} session={session} />)}
          </div>
        </details>

        <section className="overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="border-b border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">{selected.bookTitle} · {selected.characterName}</p>
            <h2 className="mt-1 text-xl font-black leading-7 tracking-[-0.05em] text-[var(--foreground)] sm:text-2xl">{selected.title}</h2>
          </div>
          <div className="grid min-h-[430px] content-start gap-4 p-5">
            {messages.map((message) => (
              <div key={message.id} className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-[var(--accent)] text-white" : "bg-[var(--surface-soft)] text-[var(--foreground)]"}`}>
                {message.content}
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--line)] p-4">
            <div className="flex gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] p-2">
              <input className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" placeholder="대화를 이어 입력하세요" aria-label="대화 입력" />
              <button type="button" className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-black text-white">보내기</button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
