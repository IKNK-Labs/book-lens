"use client";

import { useActionState } from "react";
import { saveUserPreference } from "../../app/settings/actions";
import {
  AGE_GROUPS,
  DIFFICULTY_LEVELS,
  EXPLANATION_STYLES,
  INTEREST_OPTIONS,
  RESPONSE_LENGTHS,
  type PreferenceActionState,
  type UserPreference,
} from "../../lib/settings/preferences";
import { Card } from "../ui/Card";
import { PreferencePreview } from "./PreferencePreview";

type UserPreferenceFormProps = {
  preference: UserPreference;
  canSave: boolean;
  disabledReason: string | null;
};

const initialActionState: PreferenceActionState = {
  status: "idle",
  message: "",
};

function OptionChip({
  name,
  value,
  defaultChecked,
  disabled,
  multiple = false,
}: {
  name: string;
  value: string;
  defaultChecked: boolean;
  disabled: boolean;
  multiple?: boolean;
}) {
  return (
    <label className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>
      <input
        className="peer sr-only"
        defaultChecked={defaultChecked}
        disabled={disabled}
        name={name}
        type={multiple ? "checkbox" : "radio"}
        value={value}
      />
      <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-extrabold text-[var(--accent-strong)] peer-checked:border-transparent peer-checked:bg-gradient-to-r peer-checked:from-[var(--pink)] peer-checked:to-[var(--violet)] peer-checked:text-white peer-disabled:opacity-60 sm:text-sm">
        {value}
      </span>
    </label>
  );
}

function OptionGroup({
  label,
  name,
  options,
  value,
  disabled,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
      <span className="text-sm font-black text-[var(--accent-strong)]">{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <OptionChip
            key={option}
            defaultChecked={option === value}
            disabled={disabled}
            name={name}
            value={option}
          />
        ))}
      </div>
    </div>
  );
}

export function UserPreferenceForm({
  preference,
  canSave,
  disabledReason,
}: UserPreferenceFormProps) {
  const [actionState, formAction, isPending] = useActionState(
    saveUserPreference,
    initialActionState,
  );
  const disabled = !canSave || isPending;

  return (
    <form action={formAction} className="grid gap-5">
      <Card>
        <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--accent-strong)]">대상 기준</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">정확한 생년월일이 아니라, AI 응답을 맞출 대상 연령대를 선택합니다.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {AGE_GROUPS.map((age) => (
            <OptionChip
              key={age}
              defaultChecked={age === preference.ageGroup}
              disabled={disabled}
              name="age_group"
              value={age}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--accent-strong)]">응답 방식</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">캐릭터의 말투와 성격은 유지하고, 설명 난이도와 길이만 조절합니다.</p>
        <div className="mt-5 grid gap-4">
          <OptionGroup
            disabled={disabled}
            label="읽기/이해 수준"
            name="difficulty_level"
            options={DIFFICULTY_LEVELS}
            value={preference.difficultyLevel}
          />
          <OptionGroup
            disabled={disabled}
            label="응답 길이"
            name="response_length"
            options={RESPONSE_LENGTHS}
            value={preference.responseLength}
          />
        </div>
        <div className="mt-5">
          <p className="mb-2 text-sm font-black text-[var(--accent-strong)]">설명 방식</p>
          <div className="flex flex-wrap gap-2">
            {EXPLANATION_STYLES.map((style) => (
              <OptionChip
                key={style}
                defaultChecked={style === preference.explanationStyle}
                disabled={disabled}
                name="explanation_style"
                value={style}
              />
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--accent-strong)]">관심 주제</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">동화 추천이나 생성에 참고하는 값입니다. 캐릭터 페르소나보다 우선하지 않습니다.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => (
            <OptionChip
              key={interest}
              defaultChecked={preference.interests.includes(interest)}
              disabled={disabled}
              multiple
              name="interests"
              value={interest}
            />
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
          disabled={disabled}
          className="mt-4 w-full rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 text-sm leading-6 outline-none placeholder:text-[var(--muted)]"
          defaultValue={preference.instruction}
          maxLength={500}
          name="instruction"
        />
        <p className="mt-2 text-xs text-[var(--muted)]">최대 500자까지 입력할 수 있습니다.</p>
      </Card>

      <PreferencePreview preference={preference} />

      <Card>
        {disabledReason && (
          <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">
            {disabledReason}
          </p>
        )}
        {actionState.message && (
          <p
            className={`mb-4 rounded-2xl border p-3 text-sm font-bold ${
              actionState.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {actionState.message}
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="submit"
            disabled={disabled}
            className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "저장 중..." : "저장하기"}
          </button>
          <button
            type="reset"
            disabled={disabled}
            className="rounded-full border border-[var(--line)] px-4 py-3 text-sm font-black text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            불러온 값으로 되돌리기
          </button>
        </div>
      </Card>
    </form>
  );
}
