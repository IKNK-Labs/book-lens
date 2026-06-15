"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string, path = "/login"): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirectWithError("이메일과 비밀번호를 입력해 주세요.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithError("로그인 정보를 다시 확인해 주세요.");
  }

  redirect("/books");
}

export async function signUp(formData: FormData) {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");
  const nickname = getFormValue(formData, "nickname");

  if (!email || !password) {
    redirectWithError("회원가입할 이메일과 비밀번호를 입력해 주세요.", "/signup");
  }

  if (password.length < 6) {
    redirectWithError("비밀번호는 최소 6자 이상이어야 해요.", "/signup");
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/books`,
      data: {
        nickname: nickname || email.split("@")[0],
      },
    },
  });

  if (error) {
    console.error("Supabase signUp failed", {
      code: error.code,
      message: error.message,
      status: error.status,
    });
    redirectWithError(`회원가입 실패: ${error.message}`, "/signup");
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "회원가입 요청이 완료됐어요. 이메일 인증이 필요하면 받은 편지함을 확인해 주세요.",
    )}`,
  );
}

export async function signInWithGoogle() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/settings`,
    },
  });

  if (error) {
    console.error("Supabase Google sign-in failed", {
      code: error.code,
      message: error.message,
      status: error.status,
    });
    redirectWithError(`Google 로그인 실패: ${error.message}`);
  }

  if (!data.url) {
    redirectWithError("Google 로그인 URL을 만들지 못했어요.");
  }

  redirect(data.url);
}
