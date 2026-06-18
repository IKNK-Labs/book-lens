import type { User } from "@supabase/supabase-js";
import type { Viewer } from "../mockAuth";
import { getGuestViewer, getViewer } from "../mockAuth";
import { hasSupabaseConfig } from "../supabase/env";
import { createClient } from "../supabase/server";
import {
  DEFAULT_USER_PREFERENCE,
  normalizePreferenceRow,
  type UserPreference,
  type UserPreferenceRow,
} from "./preferences";

type AuthSearchParams = {
  auth?: string;
};

type AppUserRow = {
  id: number | string;
  email: string | null;
  nickname: string | null;
};

type PreferenceRow = UserPreferenceRow & {
  id: number | string;
};

export type SettingsNotice = {
  type: "info" | "warning" | "error";
  message: string;
};

export type SettingsPageData = {
  viewer: Viewer;
  appUser: AppUserRow | null;
  preference: UserPreference;
  canSavePreference: boolean;
  preferenceBlockReason: string | null;
  notices: SettingsNotice[];
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readProvider(user: User) {
  const provider = readString(user.app_metadata?.provider);
  const providers = user.app_metadata?.providers;

  if (provider) {
    return provider;
  }

  if (Array.isArray(providers) && typeof providers[0] === "string") {
    return providers[0];
  }

  return "Google";
}

function buildSupabaseViewer(user: User, appUser?: AppUserRow | null): Viewer {
  const metadataName =
    readString(user.user_metadata?.nickname) ||
    readString(user.user_metadata?.name) ||
    readString(user.user_metadata?.full_name);
  const email = readString(appUser?.email) || user.email || "";
  const emailName = email.split("@")[0] || "";
  const name = readString(appUser?.nickname) || metadataName || emailName || "사용자";

  return {
    mode: "member",
    isMember: true,
    name,
    displayName: name.endsWith("님") ? name : `${name}님`,
    email,
    provider: readProvider(user),
    isPreview: false,
  };
}

export async function getSettingsPageData(
  searchParams?: AuthSearchParams,
): Promise<SettingsPageData> {
  if (!hasSupabaseConfig()) {
    const viewer = await getViewer(searchParams);

    return {
      viewer,
      appUser: null,
      preference: DEFAULT_USER_PREFERENCE,
      canSavePreference: false,
      preferenceBlockReason: viewer.isPreview
        ? "미리보기 모드에서는 설정을 저장하지 않습니다."
        : "Supabase Auth 환경변수가 없어 설정을 불러올 수 없습니다.",
      notices: viewer.isPreview
        ? [{ type: "info", message: "미리보기 모드에서는 실제 저장을 수행하지 않습니다." }]
        : [],
    };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      viewer: getGuestViewer(),
      appUser: null,
      preference: DEFAULT_USER_PREFERENCE,
      canSavePreference: false,
      preferenceBlockReason: "로그인 세션을 확인할 수 없습니다.",
      notices: [],
    };
  }

  const fallbackViewer = buildSupabaseViewer(userData.user);
  const { data: appUser, error: appUserError } = await supabase
    .from("app_user")
    .select("id, email, nickname")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (appUserError) {
    return {
      viewer: fallbackViewer,
      appUser: null,
      preference: DEFAULT_USER_PREFERENCE,
      canSavePreference: false,
      preferenceBlockReason: "계정 정보를 조회하지 못해 설정 저장을 중단했습니다.",
      notices: [
        {
          type: "error",
          message: "app_user 조회 중 오류가 발생했습니다. RLS 또는 trigger 설정을 확인해야 합니다.",
        },
      ],
    };
  }

  if (!appUser) {
    return {
      viewer: fallbackViewer,
      appUser: null,
      preference: DEFAULT_USER_PREFERENCE,
      canSavePreference: false,
      preferenceBlockReason: "계정 프로필이 아직 생성되지 않아 설정을 저장할 수 없습니다.",
      notices: [
        {
          type: "warning",
          message: "app_user row가 없습니다. Supabase Auth 가입 후 DB trigger가 동작했는지 확인이 필요합니다.",
        },
      ],
    };
  }

  const viewer = buildSupabaseViewer(userData.user, appUser);
  const { data: preferenceRows, error: preferenceError } = await supabase
    .from("user_preference")
    .select("id, age_group, difficulty_level, response_length, instruction")
    .eq("user_id", appUser.id)
    .limit(2);

  if (preferenceError) {
    return {
      viewer,
      appUser,
      preference: DEFAULT_USER_PREFERENCE,
      canSavePreference: false,
      preferenceBlockReason: "설정을 조회하지 못해 저장을 중단했습니다.",
      notices: [
        {
          type: "error",
          message: "user_preference 조회 중 오류가 발생했습니다. RLS 정책을 확인해야 합니다.",
        },
      ],
    };
  }

  const rows = (preferenceRows ?? []) as PreferenceRow[];

  if (rows.length > 1) {
    return {
      viewer,
      appUser,
      preference: normalizePreferenceRow(rows[0]),
      canSavePreference: false,
      preferenceBlockReason: "설정 row가 여러 개라 저장을 중단했습니다.",
      notices: [
        {
          type: "error",
          message: "user_preference row가 user_id 기준 2개 이상입니다. 데이터 정합성 확인이 필요합니다.",
        },
      ],
    };
  }

  return {
    viewer,
    appUser,
    preference: normalizePreferenceRow(rows[0]),
    canSavePreference: true,
    preferenceBlockReason: null,
    notices: rows.length === 0
      ? [{ type: "info", message: "저장된 대화 설정이 없어 기본값을 표시합니다." }]
      : [],
  };
}
