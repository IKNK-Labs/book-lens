import Link from "next/link";
import type { Viewer } from "../../lib/mockAuth";

export function AppHeader({ viewer }: { viewer: Viewer }) {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--surface)]/86 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href={viewer.isMember ? "/?auth=member" : "/"} className="flex min-w-0 items-center gap-3" aria-label="Book Lens 홈">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--pink)] to-[var(--violet)] text-lg font-black text-white shadow-sm">
            B
          </span>
          <span className="truncate text-sm font-black tracking-[-0.04em] text-[var(--accent-strong)] sm:text-base">Book Lens</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] p-1 text-xs text-[var(--muted)] sm:text-sm">
          <Link href={viewer.isMember ? "/books?auth=member" : "/books"} className="rounded-full px-3 py-2 font-bold transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]">
            동화
          </Link>
          {viewer.isMember ? (
            <>
              <Link href="/chat?auth=member" className="rounded-full px-3 py-2 font-bold transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]">
                내 대화
              </Link>
              <details className="group relative">
                <summary className="list-none rounded-full px-3 py-2 font-bold text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)] [&::-webkit-details-marker]:hidden">
                  {viewer.displayName} ▾
                </summary>
                <div className="absolute right-0 top-11 grid w-36 gap-1 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-[var(--shadow)]">
                  <Link href="/settings?auth=member" className="rounded-2xl px-3 py-2 font-bold hover:bg-[var(--surface-soft)]">
                    마이페이지
                  </Link>
                  <Link href="/" className="rounded-2xl px-3 py-2 font-bold text-[var(--muted)] hover:bg-[var(--surface-soft)]">
                    로그아웃
                  </Link>
                </div>
              </details>
            </>
          ) : (
            <Link href="/login" className="rounded-full px-3 py-2 font-bold transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
