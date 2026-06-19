"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { chatApi } from "../../lib/api";
import { createClient } from "../../lib/supabase/client";
import { Card } from "../ui/Card";

export function ConversationReportShell({
  characterId,
  conversationLogId,
}: {
  characterId: string;
  conversationLogId?: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled) setUserId(data.user?.id);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!conversationLogId || !userId || autoSubmittedRef.current) return;

    autoSubmittedRef.current = true;
    setMessage("신고를 접수하는 중입니다.");

    chatApi
      .feedback({
        conversation_log_id: conversationLogId,
        feedback_type: "report",
        user_id: userId,
      })
      .then(() => {
        setMessage("신고가 접수됐습니다. 필요하면 사유를 추가로 남겨주세요.");
      })
      .catch(() => {
        autoSubmittedRef.current = false;
        setMessage("신고 접수에 실패했습니다. 아래 버튼으로 다시 시도해 주세요.");
      });
  }, [conversationLogId, userId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversationLogId || !userId || isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      await chatApi.feedback({
        conversation_log_id: conversationLogId,
        feedback_type: "report",
        reason: reason.trim() || undefined,
        user_id: userId,
      });
      setMessage("신고 사유가 저장됐습니다.");
    } catch {
      setMessage("신고 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="max-w-2xl">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">
          conversation_feedback
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[var(--accent-strong)]">
          대화 신고하기
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          문제가 있다고 느낀 봇 응답을 신고합니다. 신고 내용은 피드백 테이블의 신고 유형과 사유로 저장됩니다.
        </p>
      </div>

      {!conversationLogId ? (
        <p className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4 text-sm font-bold text-[var(--accent-strong)]">
          신고할 대화 응답을 찾을 수 없습니다. 채팅 화면에서 봇 응답을 받은 뒤 다시 시도해 주세요.
        </p>
      ) : (
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-black text-[var(--accent-strong)]">신고 사유</span>
            <textarea
              className="min-h-40 resize-y rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4 text-sm leading-6 outline-none placeholder:text-[var(--muted)]"
              placeholder="부적절한 표현, 잘못된 답변, 안전 문제 등 신고 사유를 입력해 주세요."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          {message ? (
            <p className="text-sm font-bold text-[var(--accent-strong)]">{message}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!userId || isSubmitting}
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-black text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "사유 저장 중" : "신고 사유 저장"}
            </button>
            <button
              type="button"
              className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-black text-[var(--accent-strong)]"
              onClick={() => router.push(`/chat/${characterId}`)}
            >
              취소
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
