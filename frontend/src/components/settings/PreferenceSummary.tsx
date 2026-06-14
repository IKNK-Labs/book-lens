import { mockPreference } from "../../data/mock";
import { Card } from "../ui/Card";

const rows = [
  ["대상 연령대", mockPreference.ageGroup],
  ["읽기/이해 수준", mockPreference.difficultyLevel],
  ["응답 길이", mockPreference.responseLength],
  ["설명 방식", mockPreference.explanationStyle],
  ["관심 주제", mockPreference.interests.join(", ")],
];

export function PreferenceSummary() {
  // TODO: PATCH /api/users/me/settings 연결 예정
  return (
    <Card className="lg:sticky lg:top-24">
      <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--accent-strong)]">현재 설정 요약</h2>
      <div className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
            <p className="text-xs font-black text-[var(--muted)]">{label}</p>
            <p className="mt-1 text-sm font-extrabold text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-2">
        <button type="button" className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-black text-white">
          저장하기
        </button>
        <button type="button" className="rounded-full border border-[var(--line)] px-4 py-3 text-sm font-black text-[var(--muted)]">
          기본값으로 되돌리기
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">TODO: PATCH /api/users/me/settings/ 연결 예정</p>
    </Card>
  );
}
