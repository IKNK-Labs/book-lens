import Link from "next/link";
import { signUp } from "../login/actions";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen grid place-items-center px-5 py-10 bg-gradient-to-br from-[#fff7fb] via-[#f4efff] to-[#fff5e8] text-[#594764]">
      <section className="w-full max-w-[420px] bg-white/90 border border-[#eadcf0] rounded-[28px] p-5 shadow-[0_18px_40px_rgba(180,140,205,0.18)]">
        <div className="mb-5">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="w-10 h-10 rounded-[16px] bg-gradient-to-br from-[#f6a9d2] to-[#c7a8ff] text-white font-black grid place-items-center">
              B
            </span>
            <b className="text-[#735292]">book-lens</b>
          </Link>
          <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-[#ffd6ea] via-[#d9c7ff] to-[#ffeabf] grid place-items-center text-xl mb-3">
            📚
          </div>
          <h1 className="m-0 text-2xl tracking-tight text-[#7d5ba6]">
            회원가입
          </h1>
          <p className="mt-2 text-[12px] leading-relaxed text-[#94859d]">
            이메일과 닉네임으로 book-lens 계정을 만들어보세요.
          </p>
        </div>

        {params.error ? (
          <p className="mb-3 rounded-2xl border border-[#f2c5cd] bg-[#fff5f6] px-3 py-2 text-[12px] font-bold text-[#b15a69]">
            {params.error}
          </p>
        ) : null}

        {params.message ? (
          <p className="mb-3 rounded-2xl border border-[#cbe7d2] bg-[#f5fff7] px-3 py-2 text-[12px] font-bold text-[#4f8a63]">
            {params.message}
          </p>
        ) : null}

        <form className="grid gap-3">
          <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
            <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
              이메일
            </label>
            <input
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              className="w-full min-h-[38px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-3 py-2 outline-none focus:border-[#c7a8ff]"
            />
          </div>

          <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
            <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
              비밀번호
            </label>
            <input
              name="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              required
              minLength={6}
              className="w-full min-h-[38px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-3 py-2 outline-none focus:border-[#c7a8ff]"
            />
          </div>

          <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
            <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
              닉네임
            </label>
            <input
              name="nickname"
              type="text"
              maxLength={50}
              placeholder="표시할 닉네임"
              className="w-full min-h-[38px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-3 py-2 outline-none focus:border-[#c7a8ff]"
            />
          </div>

          <button
            formAction={signUp}
            className="rounded-full px-4 py-3 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] shadow-[0_10px_22px_rgba(198,148,220,0.22)]"
          >
            회원가입
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-[#94859d]">
          <span>이미 계정이 있나요?</span>
          <Link href="/login" className="text-[#8b69a3] font-bold">
            로그인
          </Link>
        </div>
      </section>
    </main>
  );
}
