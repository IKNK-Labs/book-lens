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
export const EXPLANATION_STYLES = [
  "쉽게 설명",
  "질문을 덧붙이기",
  "교훈 포함",
  "원작 중심",
  "감정 중심",
];
export const INTEREST_OPTIONS = [
  "모험",
  "판타지",
  "동물",
  "우정",
  "용기",
  "가족",
  "과학",
  "추리",
  "감성",
];

export type UserPreference = {
  ageGroup: string;
  difficultyLevel: string;
  responseLength: string;
  explanationStyle: string;
  interests: string[];
  instruction: string;
};

export type UserPreferenceRow = {
  age_group: string | null;
  difficulty_level: string | null;
  response_length: string | null;
  explanation_style: string | null;
  interests: unknown;
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
  explanationStyle: "쉽게 설명",
  interests: [],
  instruction: "",
};

function pickAllowed(value: unknown, options: string[], fallback: string) {
  return typeof value === "string" && options.includes(value) ? value : fallback;
}

function normalizeInterests(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (interest): interest is string =>
      typeof interest === "string" && INTEREST_OPTIONS.includes(interest),
  );
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
    explanationStyle: pickAllowed(
      row?.explanation_style,
      EXPLANATION_STYLES,
      DEFAULT_USER_PREFERENCE.explanationStyle,
    ),
    interests: normalizeInterests(row?.interests),
    instruction: readText(row?.instruction),
  };
}

export function normalizePreferenceFormData(formData: FormData): UserPreference {
  const instruction = readText(formData.get("instruction")).slice(0, 500);
  const interests = formData
    .getAll("interests")
    .filter(
      (interest): interest is string =>
        typeof interest === "string" && INTEREST_OPTIONS.includes(interest),
    );

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
    explanationStyle: pickAllowed(
      formData.get("explanation_style"),
      EXPLANATION_STYLES,
      DEFAULT_USER_PREFERENCE.explanationStyle,
    ),
    interests,
    instruction,
  };
}

export function toPreferencePayload(preference: UserPreference) {
  return {
    age_group: preference.ageGroup,
    difficulty_level: preference.difficultyLevel,
    response_length: preference.responseLength,
    explanation_style: preference.explanationStyle,
    interests: preference.interests,
    instruction: preference.instruction,
  };
}
