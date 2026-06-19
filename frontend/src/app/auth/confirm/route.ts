import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getSafeNext } from "@/lib/authNext";
import { createClient } from "@/lib/supabase/server";
import {
  getMissingSupabaseConfigMessage,
  hasSupabaseConfig,
} from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = getSafeNext(requestUrl.searchParams.get("next"), "/books");

  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(getMissingSupabaseConfigMessage())}&next=${encodeURIComponent(next)}`,
        requestUrl.origin,
      ),
    );
  }

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=이메일 인증 링크를 확인하지 못했어요.", requestUrl.origin),
  );
}
