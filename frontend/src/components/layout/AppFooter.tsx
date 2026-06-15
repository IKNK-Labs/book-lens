import Link from "next/link";
import type { Viewer } from "../../lib/mockAuth";

export function AppFooter({ viewer }: { viewer: Viewer }) {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {viewer.isMember ? (
          <p>
            <b className="text-[var(--accent-strong)]">{viewer.displayName}</b>의 대화 기록과 맞춤 설정을 안전하게 이어갈 수 있어요.
          </p>
        ) : (
          <p>로그인하면 동화 구연 기록과 캐릭터 대화 설정을 저장할 수 있어요.</p>
        )}
        {!viewer.isMember ? (
          <Link href="/login" className="w-fit rounded-full border border-[var(--line)] px-4 py-2 font-black text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)]">
            로그인
          </Link>
        ) : null}
      </div>
    </footer>
  );
}
