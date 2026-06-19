import { NextResponse } from "next/server";
import { getSafeNext } from "@/lib/authNext";
import { createClient } from "@/lib/supabase/server";
import {
  getMissingSupabaseConfigMessage,
  hasSupabaseConfig,
} from "@/lib/supabase/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNext(requestUrl.searchParams.get("next"));

  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(getMissingSupabaseConfigMessage())}&next=${encodeURIComponent(next)}`,
        requestUrl.origin,
      ),
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent("Google 로그인 인증을 완료하지 못했어요.")}&next=${encodeURIComponent(next)}`, requestUrl.origin),
  );
}
