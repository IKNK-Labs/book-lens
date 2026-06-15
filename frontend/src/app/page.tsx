import Link from "next/link";
import { AppShell } from "../components/layout/AppShell";
import { BookCard } from "../components/books/BookCard";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { mockBooks, mockCharacters, mockConversationSessions } from "../data/mock";
import { getViewer } from "../lib/mockAuth";

type PageProps = { searchParams: Promise<{ auth?: string }> };

export default async function Page({ searchParams }: PageProps) {
  const viewer = getViewer(await searchParams);
  const featuredBooks = mockBooks.slice(0, 3);

  return (
    <AppShell viewer={viewer}>
      <div className="grid gap-8">
        <section className="rounded-[36px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)] sm:p-10">
          <SectionHeader
            eyebrow="Book Lens"
            title={viewer.isMember ? "오늘도 동화 속 친구를 만나볼까요?" : "동화를 둘러보고 캐릭터를 만나보세요"}
            description={viewer.isMember ? "추천 동화와 저장된 대화를 한곳에서 이어갈 수 있어요." : "로그인하지 않아도 동화를 검색하고 상세 정보를 살펴볼 수 있어요."}
          />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input className="min-h-12 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-5 text-sm outline-none placeholder:text-[var(--muted)]" placeholder="찾고 싶은 동화 제목을 입력하세요" aria-label="동화 검색" />
            <Link href={viewer.isMember ? "/books?auth=member" : "/books"} className="grid min-h-12 place-items-center rounded-full bg-[var(--accent)] px-6 text-sm font-black text-white">
              동화 검색
            </Link>
          </div>
          {!viewer.isMember ? <p className="mt-4 text-sm font-bold text-[var(--muted)]">로그인하면 대화 기록과 맞춤 설정을 저장할 수 있어요.</p> : null}
        </section>

        <section>
          <SectionHeader title={viewer.isMember ? "맞춤 추천 동화" : "지금 볼 수 있는 동화"} description={viewer.isMember ? "제석님의 관심 주제와 최근 대화를 바탕으로 골랐어요." : "먼저 이야기를 살펴보고, 마음에 드는 동화를 선택해 보세요."} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} isMember={viewer.isMember} />
            ))}
          </div>
        </section>

        {viewer.isMember ? (
          <section>
            <SectionHeader title="최근/저장 대화" description="저장된 대화에서 바로 이어갈 수 있어요." />
            <div className="grid gap-4 lg:grid-cols-3">
              {mockConversationSessions.map((session) => (
                <Card key={session.id} className="flex flex-col">
                  <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--foreground)]">{session.title}</h2>
                  <p className="mt-1 text-xs font-bold text-[var(--accent-strong)]">{session.bookTitle} · {session.characterName}</p>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[var(--muted)]">{session.lastMessage}</p>
                  <Link href={`/chat/${session.characterId}?auth=member`} className="mt-4 w-fit rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-black text-white">내 대화 이어가기</Link>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <SectionHeader title="인기 캐릭터" description="동화 상세에서 캐릭터를 확인하고 로그인 후 대화를 시작할 수 있어요." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mockCharacters.map((character) => (
                <Card key={character.id}>
                  <div className="text-4xl">{character.avatarEmoji}</div>
                  <h2 className="mt-3 text-lg font-black text-[var(--foreground)]">{character.name}</h2>
                  <p className="mt-1 text-xs font-bold text-[var(--accent-strong)]">{character.bookTitle}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{character.shortBio}</p>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
