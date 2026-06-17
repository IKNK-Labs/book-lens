import { Card } from "../ui/Card";
import type { UserPreference } from "../../lib/settings/preferences";

type PreferenceSummaryProps = {
  preference: UserPreference;
};

export function PreferenceSummary({ preference }: PreferenceSummaryProps) {
  const rows = [
    ["대상 연령대", preference.ageGroup],
    ["읽기/이해 수준", preference.difficultyLevel],
    ["응답 길이", preference.responseLength],
    ["설명 방식", preference.explanationStyle],
    ["관심 주제", preference.interests.length > 0 ? preference.interests.join(", ") : "선택 없음"],
  ];

  return (
    <Card className="lg:sticky lg:top-24">
      <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--accent-strong)]">저장된 설정 요약</h2>
      <div className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
            <p className="text-xs font-black text-[var(--muted)]">{label}</p>
            <p className="mt-1 text-sm font-extrabold text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
        변경 사항은 왼쪽 설정 영역의 저장 버튼을 누른 뒤 반영됩니다.
      </p>
    </Card>
  );
}
