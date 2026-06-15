import { AppShell } from "../../components/layout/AppShell";
import { UserPreferenceForm } from "../../components/settings/UserPreferenceForm";
import { PreferenceSummary } from "../../components/settings/PreferenceSummary";
import { Card } from "../../components/ui/Card";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { mockViewerAccount } from "../../data/mock";
import { getViewer } from "../../lib/mockAuth";

type SettingsPageProps = { searchParams: Promise<{ auth?: string }> };

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const viewer = getViewer(await searchParams);

  return (
    <AppShell viewer={viewer}>
      <div className="grid gap-6">
        <SectionHeader eyebrow="My page" title="마이페이지" description="계정 정보와 캐릭터 대화 설정을 한곳에서 확인하세요." />
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-[var(--accent-strong)]">계정</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-2xl bg-[var(--surface-soft)] p-3"><dt className="font-black text-[var(--muted)]">이름</dt><dd className="mt-1 font-bold text-[var(--foreground)]">{mockViewerAccount.name}</dd></div>
                <div className="rounded-2xl bg-[var(--surface-soft)] p-3"><dt className="font-black text-[var(--muted)]">이메일</dt><dd className="mt-1 font-bold text-[var(--foreground)]">{mockViewerAccount.email}</dd></div>
                <div className="rounded-2xl bg-[var(--surface-soft)] p-3"><dt className="font-black text-[var(--muted)]">로그인 방식</dt><dd className="mt-1 font-bold text-[var(--foreground)]">{mockViewerAccount.provider}</dd></div>
              </dl>
            </div>
            <button type="button" className="w-fit rounded-full border border-[var(--line)] px-5 py-3 text-sm font-black text-[var(--muted)]">로그아웃</button>
          </div>
        </Card>
        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="mb-4 text-xl font-black tracking-[-0.04em] text-[var(--accent-strong)]">대화 설정</h2>
            <UserPreferenceForm />
          </div>
          <PreferenceSummary />
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
