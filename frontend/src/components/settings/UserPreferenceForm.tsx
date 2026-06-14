import { mockPreference } from "../../data/mock";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { SegmentedControl } from "../ui/SegmentedControl";
import { PreferencePreview } from "./PreferencePreview";

const ageGroups = ["2세", "3세", "4세", "5세", "6세", "초등 1~2학년", "초등 3~4학년", "초등 5~6학년", "청소년", "성인"];
const explanationStyles = ["쉽게 설명", "질문을 덧붙이기", "교훈 포함", "원작 중심", "감정 중심"];
const interests = ["모험", "판타지", "동물", "우정", "용기", "가족", "과학", "추리", "감성"];

export function UserPreferenceForm() {
  return (
    <div className="grid gap-5">
      <Card>
        <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--accent-strong)]">대상 기준</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">정확한 생년월일이 아니라, AI 응답을 맞출 대상 연령대를 선택합니다.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ageGroups.map((age) => (
            <Chip key={age} interactive active={age === mockPreference.ageGroup}>
              {age}
            </Chip>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--accent-strong)]">응답 방식</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">캐릭터의 말투와 성격은 유지하고, 설명 난이도와 길이만 조절합니다.</p>
        <div className="mt-5 grid gap-4">
          <SegmentedControl label="읽기/이해 수준" options={["쉬움", "보통", "깊이 있게"]} active={mockPreference.difficultyLevel} />
          <SegmentedControl label="응답 길이" options={["짧게", "보통", "자세히"]} active={mockPreference.responseLength} />
        </div>
        <div className="mt-5">
          <p className="mb-2 text-sm font-black text-[var(--accent-strong)]">설명 방식</p>
          <div className="flex flex-wrap gap-2">
            {explanationStyles.map((style) => (
              <Chip key={style} interactive active={style === mockPreference.explanationStyle}>
                {style}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--accent-strong)]">관심 주제</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">동화 추천이나 생성에 참고하는 값입니다. 캐릭터 페르소나보다 우선하지 않습니다.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {interests.map((interest) => (
            <Chip key={interest} interactive active={mockPreference.interests.includes(interest)}>
              {interest}
            </Chip>
          ))}
        </div>
      </Card>

      <Card>
        <label className="text-lg font-black tracking-[-0.04em] text-[var(--accent-strong)]" htmlFor="preference-instruction">
          사용자 지시사항
        </label>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">캐릭터 페르소나, 원작 설정, 안전 규칙을 깨지 않는 범위에서만 반영됩니다.</p>
        <textarea
          id="preference-instruction"
          rows={5}
          className="mt-4 w-full rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 text-sm leading-6 outline-none placeholder:text-[var(--muted)]"
          defaultValue={mockPreference.instruction}
        />
        <p className="mt-2 text-xs text-[var(--muted)]">최대 500자까지 입력할 수 있습니다.</p>
      </Card>

      <PreferencePreview />
    </div>
  );
}
