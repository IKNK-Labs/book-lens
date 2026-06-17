"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMissingSupabaseConfigMessage,
  hasSupabaseConfig,
} from "@/lib/supabase/env";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string): never {
  redirect(`/admin/login?error=${encodeURIComponent(message)}`);
}

export async function adminLogin(formData: FormData) {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirectWithError("이메일과 비밀번호를 입력해 주세요.");
  }

  if (!hasSupabaseConfig()) {
    redirectWithError(getMissingSupabaseConfigMessage());
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithError("로그인 정보를 다시 확인해 주세요.");
  }

  redirect("/admin");
}
