import { redirect } from "next/navigation";
import { AppShell } from "../../components/layout/AppShell";
import { UserPreferenceForm } from "../../components/settings/UserPreferenceForm";
import { PreferenceSummary } from "../../components/settings/PreferenceSummary";
import { Card } from "../../components/ui/Card";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { getLoginRedirect } from "../../lib/authNext";
import { getSettingsPageData } from "../../lib/settings/data";
import { signOut } from "../logout/actions";

type SettingsPageProps = { searchParams: Promise<{ auth?: string }> };

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const settingsData = await getSettingsPageData(await searchParams);
  const {
    viewer,
    preference,
    canSavePreference,
    preferenceBlockReason,
    notices,
  } = settingsData;

  if (!viewer.isMember) {
    redirect(getLoginRedirect("마이페이지를 보려면 로그인이 필요합니다.", "/settings"));
  }

  return (
    <AppShell viewer={viewer}>
      <div className="grid gap-6">
        <SectionHeader eyebrow="My page" title="마이페이지" description="계정 정보와 캐릭터 대화 설정을 한곳에서 확인하세요." />
        {notices.length > 0 && (
          <div className="grid gap-2">
            {notices.map((notice) => (
              <div
                key={notice.message}
                className={`rounded-3xl border px-4 py-3 text-sm font-bold ${
                  notice.type === "error"
                    ? "border-red-200 bg-red-50 text-red-600"
                    : notice.type === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted)]"
                }`}
              >
                {notice.message}
              </div>
            ))}
          </div>
        )}
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-[var(--accent-strong)]">계정</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-2xl bg-[var(--surface-soft)] p-3"><dt className="font-black text-[var(--muted)]">이름</dt><dd className="mt-1 font-bold text-[var(--foreground)]">{viewer.name}</dd></div>
                <div className="rounded-2xl bg-[var(--surface-soft)] p-3"><dt className="font-black text-[var(--muted)]">이메일</dt><dd className="mt-1 font-bold text-[var(--foreground)]">{viewer.email || "이메일 정보 없음"}</dd></div>
                <div className="rounded-2xl bg-[var(--surface-soft)] p-3"><dt className="font-black text-[var(--muted)]">로그인 방식</dt><dd className="mt-1 font-bold text-[var(--foreground)]">{viewer.provider || "알 수 없음"}</dd></div>
              </dl>
            </div>
            <form action={signOut}>
              <button type="submit" className="w-fit rounded-full border border-[var(--line)] px-5 py-3 text-sm font-black text-[var(--muted)]">로그아웃</button>
            </form>
          </div>
        </Card>
        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="mb-4 text-xl font-black tracking-[-0.04em] text-[var(--accent-strong)]">대화 설정</h2>
            <UserPreferenceForm
              canSave={canSavePreference}
              disabledReason={preferenceBlockReason}
              preference={preference}
            />
          </div>
          <PreferenceSummary preference={preference} />
        </section>
        <Card className="border-red-200/70">
          <h2 className="text-xl font-black tracking-[-0.04em] text-red-500">위험 영역</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">회원탈퇴는 계정과 저장된 대화 기록을 삭제하는 작업입니다.</p>
          <button type="button" className="mt-4 rounded-full border border-red-300 px-5 py-3 text-sm font-black text-red-500">회원탈퇴</button>
        </Card>
      </div>
    </AppShell>
  );
}
