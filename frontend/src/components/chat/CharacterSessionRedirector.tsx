"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, chatApi } from "../../lib/api";
import { createClient } from "../../lib/supabase/client";
import { Card } from "../ui/Card";

const DEFAULT_SESSION_ERROR_MESSAGE =
  "대화방을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.";

function getSessionErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return DEFAULT_SESSION_ERROR_MESSAGE;

  switch (error.status) {
    case 400:
      return "대화방 요청 정보가 올바르지 않습니다.";
    case 401:
      return "로그인 세션이 만료되었습니다. 다시 로그인해 주세요.";
    case 403:
      return "로그인 사용자와 요청 사용자가 일치하지 않습니다.";
    case 404:
      return "캐릭터 정보를 찾지 못했습니다.";
    case 503:
      return "서버 인증 설정을 확인해야 합니다.";
    default:
      return DEFAULT_SESSION_ERROR_MESSAGE;
  }
}

export function CharacterSessionRedirector({ characterId }: { characterId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const numericCharacterId = Number(characterId);
  const authPreview = searchParams.get("auth") === "member";
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(numericCharacterId) || numericCharacterId <= 0) {
      setError("잘못된 캐릭터 ID입니다.");
      return;
    }

    let cancelled = false;

    async function createAndOpenSession() {
      setError("");

      try {
        const supabase = createClient();
        const [{ data, error: authError }, { data: sessionData }] = await Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession(),
        ]);
        const userId = data.user?.id;
        const accessToken = sessionData.session?.access_token ?? "";

        if (authError || !userId || !accessToken) {
          if (!cancelled) setError("로그인한 사용자를 확인하지 못했습니다.");
          return;
        }

        const session = await chatApi.createSession(numericCharacterId, userId, accessToken);
        if (!cancelled) {
          const params = new URLSearchParams({ session_id: session.id });
          if (authPreview) params.set("auth", "member");
          router.replace(`/chat?${params.toString()}`);
        }
      } catch (error) {
        if (!cancelled) {
          setError(getSessionErrorMessage(error));
        }
      }
    }

    createAndOpenSession();

    return () => {
      cancelled = true;
    };
  }, [authPreview, numericCharacterId, router]);

  return (
    <Card>
      <h1 className="text-xl font-black text-[var(--accent-strong)]">
        대화방을 준비하는 중입니다.
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        캐릭터와의 대화를 저장할 세션을 확인하고 있습니다.
      </p>
      {error ? (
        <p className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold text-[var(--accent-strong)]">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
