export const AGE_GROUPS = [
  "2세",
  "3세",
  "4세",
  "5세",
  "6세",
  "초등 1~2학년",
  "초등 3~4학년",
  "초등 5~6학년",
  "청소년",
  "성인",
];

export const DIFFICULTY_LEVELS = ["쉬움", "보통", "깊이 있게"];
export const RESPONSE_LENGTHS = ["짧게", "보통", "자세히"];

export type UserPreference = {
  ageGroup: string;
  difficultyLevel: string;
  responseLength: string;
  instruction: string;
};

export type UserPreferenceRow = {
  age_group: string | null;
  difficulty_level: string | null;
  response_length: string | null;
  instruction: string | null;
};

export type PreferenceActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const DEFAULT_USER_PREFERENCE: UserPreference = {
  ageGroup: "초등 1~2학년",
  difficultyLevel: "보통",
  responseLength: "보통",
  instruction: "",
};

function pickAllowed(value: unknown, options: string[], fallback: string) {
  return typeof value === "string" && options.includes(value) ? value : fallback;
}

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizePreferenceRow(
  row: Partial<UserPreferenceRow> | null | undefined,
): UserPreference {
  return {
    ageGroup: pickAllowed(
      row?.age_group,
      AGE_GROUPS,
      DEFAULT_USER_PREFERENCE.ageGroup,
    ),
    difficultyLevel: pickAllowed(
      row?.difficulty_level,
      DIFFICULTY_LEVELS,
      DEFAULT_USER_PREFERENCE.difficultyLevel,
    ),
    responseLength: pickAllowed(
      row?.response_length,
      RESPONSE_LENGTHS,
      DEFAULT_USER_PREFERENCE.responseLength,
    ),
    instruction: readText(row?.instruction),
  };
}

export function normalizePreferenceFormData(formData: FormData): UserPreference {
  const instruction = readText(formData.get("instruction")).slice(0, 500);

  return {
    ageGroup: pickAllowed(
      formData.get("age_group"),
      AGE_GROUPS,
      DEFAULT_USER_PREFERENCE.ageGroup,
    ),
    difficultyLevel: pickAllowed(
      formData.get("difficulty_level"),
      DIFFICULTY_LEVELS,
      DEFAULT_USER_PREFERENCE.difficultyLevel,
    ),
    responseLength: pickAllowed(
      formData.get("response_length"),
      RESPONSE_LENGTHS,
      DEFAULT_USER_PREFERENCE.responseLength,
    ),
    instruction,
  };
}

export function toPreferencePayload(preference: UserPreference) {
  return {
    age_group: preference.ageGroup,
    difficulty_level: preference.difficultyLevel,
    response_length: preference.responseLength,
    instruction: preference.instruction,
  };
}