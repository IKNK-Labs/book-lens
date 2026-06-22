"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { chatApi } from "../../lib/api";
import { createClient } from "../../lib/supabase/client";
import { Card } from "../ui/Card";

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
      } catch {
        if (!cancelled) {
          setError("대화방을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.");
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
