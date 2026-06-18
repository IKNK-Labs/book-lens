const MISSING_SUPABASE_CONFIG_MESSAGE =
  "Supabase Auth 환경변수 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY가 필요합니다.";

type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

function readEnvValue(value: string | undefined) {
  return value?.trim() ?? "";
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = readEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = readEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function hasSupabaseConfig() {
  return getSupabaseConfig() !== null;
}

export function requireSupabaseConfig() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(MISSING_SUPABASE_CONFIG_MESSAGE);
  }

  return config;
}

export function getMissingSupabaseConfigMessage() {
  return MISSING_SUPABASE_CONFIG_MESSAGE;
}
