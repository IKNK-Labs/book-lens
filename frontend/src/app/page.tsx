import { AppShell } from "../components/layout/AppShell";
import { BookCard } from "../components/books/BookCard";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import type { BookResponse } from "../lib/api";
import { toCardBook } from "../lib/books/format";
import { getViewer } from "../lib/mockAuth";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ auth?: string }> };

const API_BASE_URL =
  process.env.SERVER_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getHomeBooks() {
  try {
    const response = await fetch(new URL("/api/books", API_BASE_URL), { cache: "no-store" });

    if (!response.ok) {
      return [];
    }

    const books = (await response.json()) as BookResponse[];
    return books.slice(0, 3).map(toCardBook);
  } catch {
    return [];
  }
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const viewer = await getViewer(params);
  const featuredBooks = await getHomeBooks();

  return (
    <AppShell viewer={viewer}>
      <div className="grid gap-8">
        <section className="rounded-[36px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)] sm:p-10">
          <SectionHeader
            eyebrow="Book Lens"
            title={viewer.isMember ? "오늘은 어떤 동화와 친구를 만나볼까요?" : "동화를 둘러보고 캐릭터를 만나보세요."}
            description={
              viewer.isMember
                ? "등록된 동화를 살펴보고 마음에 드는 이야기를 이어가 보세요."
                : "등록된 동화를 살펴보고, 로그인 후 상세 화면에서 이야기를 이어갈 수 있어요."
            }
          />
          <form action="/books" method="get" className="grid gap-3 sm:grid-cols-[1fr_auto]">
            {viewer.isPreview ? <input type="hidden" name="auth" value="member" /> : null}
            <input
              className="min-h-12 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-5 text-sm outline-none placeholder:text-[var(--muted)]"
              placeholder="찾고 싶은 동화 제목을 입력하세요."
              aria-label="동화 검색"
              name="search"
            />
            <button
              type="submit"
              className="grid min-h-12 place-items-center rounded-full bg-[var(--accent)] px-6 text-sm font-black text-white"
            >
              동화 검색
            </button>
          </form>
          {!viewer.isMember ? (
            <p className="mt-4 text-sm font-bold text-[var(--muted)]">
              로그인하면 저장 기록과 설정을 사용할 수 있어요.
            </p>
          ) : null}
        </section>

        <section>
          <SectionHeader
            title="지금 볼 수 있는 동화"
            description="등록된 동화를 살펴보고 마음에 드는 이야기를 이어가 보세요."
          />
          {featuredBooks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} isMember={viewer.isMember} isPreview={viewer.isPreview} />
              ))}
            </div>
          ) : (
            <Card>
              <h2 className="text-lg font-black text-[var(--foreground)]">아직 등록된 동화가 없습니다.</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                관리자에서 도서를 등록하면 이곳에 표시됩니다.
              </p>
            </Card>
          )}
        </section>

        {viewer.isMember ? (
          <section>
            <SectionHeader
              title="최근/저장 대화"
              description="저장된 대화가 있으면 이곳에서 이어갈 수 있습니다."
            />
            <Card>
              <h2 className="text-lg font-black text-[var(--foreground)]">아직 저장된 대화가 없습니다.</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                동화 상세 화면에서 캐릭터와 대화를 시작하면 이곳에서 이어갈 수 있습니다.
              </p>
            </Card>
          </section>
        ) : (
          <section>
            <SectionHeader
              title="캐릭터 안내"
              description="실제 캐릭터 정보는 동화 상세 화면에서 확인할 수 있습니다."
            />
            <Card>
              <h2 className="text-lg font-black text-[var(--foreground)]">캐릭터 정보는 동화 상세 화면에서 확인할 수 있습니다.</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                마음에 드는 동화를 선택한 뒤 등장인물과 대화를 시작해 보세요.
              </p>
            </Card>
          </section>
        )}
      </div>
    </AppShell>
  );
}
