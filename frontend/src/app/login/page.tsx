import Link from "next/link";
import { signInWithGoogle } from "./actions";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-[520px] rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-7 text-center shadow-[var(--shadow)] sm:p-9">
        <Link href="/" className="mx-auto mb-6 inline-flex items-center gap-3" aria-label="Book Lens 홈">
          <span className="grid h-11 w-11 place-items-center rounded-[18px] bg-gradient-to-br from-[var(--pink)] to-[var(--violet)] text-lg font-black text-white">B</span>
          <b className="text-lg tracking-[-0.04em] text-[var(--accent-strong)]">Book Lens</b>
        </Link>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--accent-soft)] to-[var(--surface-muted)] text-3xl">📚</div>
        <h1 className="text-3xl font-black tracking-[-0.06em] text-[var(--accent-strong)]">Book Lens 시작하기</h1>
        <p className="mx-auto mt-3 max-w-[440px] text-sm leading-7 text-[var(--muted)] sm:text-base">동화 속 캐릭터와 대화하고, 맞춤 설정과 기록을 저장하세요.</p>

        {params.message ? (
          <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">{params.message}</p>
        ) : null}
        {params.error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">{params.error}</p>
        ) : null}

        <form action={signInWithGoogle} className="mt-8">
          <button type="submit" className="w-full rounded-full bg-[var(--accent)] px-5 py-4 text-sm font-black text-white shadow-sm">
            Google로 계속하기
          </button>
        </form>
        <Link href="/settings?auth=member" className="mt-4 inline-flex text-xs font-black text-[var(--accent-strong)] underline-offset-4 hover:underline">
          프론트엔드 미리보기로 계속하기
        </Link>
      </section>
    </main>
  );
}
