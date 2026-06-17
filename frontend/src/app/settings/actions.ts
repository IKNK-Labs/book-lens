"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseConfig } from "../../lib/supabase/env";
import { createClient } from "../../lib/supabase/server";
import {
  normalizePreferenceFormData,
  toPreferencePayload,
  type PreferenceActionState,
} from "../../lib/settings/preferences";

type AppUserIdRow = {
  id: number | string;
};

type PreferenceIdRow = {
  id: number | string;
};

function fail(message: string): PreferenceActionState {
  return { status: "error", message };
}

function success(message: string): PreferenceActionState {
  return { status: "success", message };
}

function normalizeId(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
  }

  return null;
}

export async function saveUserPreference(
  _previousState: PreferenceActionState,
  formData: FormData,
): Promise<PreferenceActionState> {
  if (!hasSupabaseConfig()) {
    return fail("Supabase Auth 환경변수가 없어 설정을 저장할 수 없습니다.");
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return fail("로그인 세션을 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요.");
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("app_user")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (appUserError) {
    return fail("계정 정보를 조회하지 못했습니다. RLS 또는 trigger 설정 확인이 필요합니다.");
  }

  if (!appUser) {
    return fail("계정 프로필이 아직 생성되지 않았습니다. app_user trigger 확인이 필요합니다.");
  }

  const appUserId = normalizeId((appUser as AppUserIdRow).id);

  if (appUserId === null) {
    return fail("계정 식별자를 확인하지 못해 설정을 저장할 수 없습니다.");
  }

  const preference = normalizePreferenceFormData(formData);
  const payload = toPreferencePayload(preference);
  const { data: existingRows, error: selectError } = await supabase
    .from("user_preference")
    .select("id")
    .eq("user_id", appUserId)
    .limit(2);

  if (selectError) {
    return fail("설정을 조회하지 못했습니다. RLS 정책 확인이 필요합니다.");
  }

  const rows = (existingRows ?? []) as PreferenceIdRow[];

  if (rows.length > 1) {
    return fail("설정 row가 여러 개라 저장을 중단했습니다. 데이터 정합성 확인이 필요합니다.");
  }

  if (rows.length === 1) {
    const { data: updatedRow, error: updateError } = await supabase
      .from("user_preference")
      .update(payload)
      .eq("id", rows[0].id)
      .eq("user_id", appUserId)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedRow) {
      return fail("설정 저장에 실패했습니다. RLS 정책을 확인해 주세요.");
    }
  } else {
    const { data: insertedRow, error: insertError } = await supabase
      .from("user_preference")
      .insert({ user_id: appUserId, ...payload })
      .select("id")
      .maybeSingle();

    if (insertError || !insertedRow) {
      return fail("설정 생성에 실패했습니다. RLS 정책을 확인해 주세요.");
    }
  }

  revalidatePath("/settings");

  return success("설정을 저장했습니다.");
}
