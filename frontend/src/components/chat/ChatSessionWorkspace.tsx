"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  chatApi,
  type ChatMessage,
  type ChatSession,
  type FeedbackType,
} from "../../lib/api";
import { createClient } from "../../lib/supabase/client";
import { Card } from "../ui/Card";
import { ChatBubble } from "./ChatBubble";
import { ChatInputBar } from "./ChatInputBar";

type UiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  conversationLogId?: string;
  isGreeting?: boolean;
  isFlagged?: boolean;
};

type ListStatus = "loading" | "ready" | "missing-user" | "error";
type MessageStatus = "idle" | "loading" | "ready" | "not-found" | "error";

function formatDate(value: string | null) {
  if (!value) return "활동 기록 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "활동 기록 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function mapTranscriptMessage(message: ChatMessage): UiChatMessage {
  return {
    id: `log-${message.id}`,
    role: message.role,
    content: message.message,
    conversationLogId: message.role === "assistant" ? String(message.id) : undefined,
    isFlagged: message.is_flagged,
  };
}

function EmptySessionState() {
  return (
    <Card>
      <h2 className="text-lg font-black text-[var(--accent-strong)]">
        아직 저장된 대화가 없습니다.
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        동화 상세 화면에서 캐릭터를 선택하면 대화를 시작할 수 있습니다.
      </p>
    </Card>
  );
}

function SessionAvatar({ session }: { session: ChatSession }) {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--accent-soft)] text-xl">
      {session.character_profile_image_url ? (
        <img
          src={session.character_profile_image_url}
          alt={session.character_name}
          className="h-full w-full object-cover"
        />
      ) : (
        session.character_emoji ?? "📖"
      )}
    </span>
  );
}

function SessionCard({
  session,
  isSelected,
  onOpen,
  onDelete,
  deleteDisabled,
}: {
  session: ChatSession;
  isSelected: boolean;
  onOpen: () => void;
  onDelete: (event: MouseEvent<HTMLButtonElement>) => void;
  deleteDisabled: boolean;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${session.title || `${session.character_name}와의 대화`} 열기`}
      className={`grid cursor-pointer gap-3 rounded-[24px] border bg-[var(--surface)] p-4 text-left transition ${
        isSelected
          ? "border-[var(--accent)] shadow-[var(--shadow)]"
          : "border-[var(--line)] hover:border-[var(--accent)]"
      }`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="grid grid-cols-[48px_1fr_auto] items-start gap-3">
        <SessionAvatar session={session} />
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-[var(--foreground)]">
            {session.title || `${session.character_name}와의 대화`}
          </h3>
          <p className="mt-1 truncate text-xs font-bold text-[var(--accent-strong)]">
            {session.character_role || session.book_title} · {session.character_name}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-black text-[var(--accent-strong)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={deleteDisabled}
          onClick={onDelete}
        >
          삭제
        </button>
      </div>
      <p className="line-clamp-2 min-h-10 text-sm leading-5 text-[var(--muted)]">
        {session.last_message_preview || "아직 메시지가 없습니다."}
      </p>
      <p className="text-xs font-bold text-[var(--muted)]">
        {formatDate(session.last_active_at)}
      </p>
    </article>
  );
}

function AssistantTypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 shadow-sm">
        <div className="flex gap-1.5" aria-label="AI 응답 생성 중">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function FeedbackActions({
  logId,
  characterId,
  selected,
  onFeedback,
}: {
  logId: string;
  characterId: number;
  selected: FeedbackType | "";
  onFeedback: (logId: string, feedbackType: FeedbackType) => void;
}) {
  const router = useRouter();

  return (
    <div className="ml-1 mt-2 flex flex-wrap gap-2">
      {(["like", "dislike"] as const).map((feedbackType) => (
        <button
          key={feedbackType}
          type="button"
          className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${
            selected === feedbackType
              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
              : "border-[var(--line)] text-[var(--accent-strong)] hover:border-[var(--accent)]"
          }`}
          onClick={() => onFeedback(logId, feedbackType)}
        >
          {feedbackType === "like" ? "좋아요" : "싫어요"}
        </button>
      ))}
      <button
        type="button"
        className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-black text-[var(--accent-strong)] transition hover:border-[var(--accent)]"
        onClick={() => {
          router.push(
            `/chat/${characterId}/report?log=${encodeURIComponent(logId)}`,
          );
        }}
      >
        신고
      </button>
    </div>
  );
}

export function ChatSessionWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSessionId = searchParams.get("session_id") ?? "";
  const authPreview = searchParams.get("auth") === "member";
  const bottomRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [feedbackByLogId, setFeedbackByLogId] = useState<Record<string, FeedbackType>>({});
  const [input, setInput] = useState("");
  const [listStatus, setListStatus] = useState<ListStatus>("loading");
  const [messageStatus, setMessageStatus] = useState<MessageStatus>("idle");
  const [listError, setListError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [sendError, setSendError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState("");

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

  function chatPath(sessionId?: string) {
    const params = new URLSearchParams();
    if (sessionId) params.set("session_id", sessionId);
    if (authPreview) params.set("auth", "member");
    const query = params.toString();
    return query ? `/chat?${query}` : "/chat";
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      setListStatus("loading");
      setListError("");

      try {
        const { data, error } = await createClient().auth.getUser();
        const authUserId = data.user?.id;

        if (error || !authUserId) {
          if (!cancelled) {
            setUserId("");
            setSessions([]);
            setListStatus("missing-user");
          }
          return;
        }

        const items = await chatApi.sessions(authUserId);
        if (!cancelled) {
          setUserId(authUserId);
          setSessions(items);
          setListStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setListError("대화방 목록을 불러오지 못했습니다.");
          setListStatus("error");
        }
      }
    }

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (listStatus !== "ready" || !userId) return;

    if (!selectedSessionId) {
      setMessages([]);
      setMessageError("");
      setSendError("");
      setMessageStatus("idle");
      return;
    }

    if (!selectedSession) {
      setMessages([]);
      setMessageError("대화방을 찾을 수 없습니다.");
      setMessageStatus("not-found");
      return;
    }

    const session = selectedSession;
    let cancelled = false;

    async function loadMessages() {
      setMessageStatus("loading");
      setMessageError("");
      setSendError("");

      try {
        const transcript = await chatApi.messages(session.id, userId);
        if (cancelled) return;

        if (transcript.length > 0) {
          setMessages(transcript.map(mapTranscriptMessage));
          setMessageStatus("ready");
          return;
        }

        const greeting = await chatApi.greeting(session.character_id, userId);
        if (cancelled) return;

        setMessages([
          {
            id: `greeting-${session.id}`,
            role: "assistant",
            content: greeting.greeting,
            conversationLogId: "",
            isGreeting: true,
          },
        ]);
        setMessageStatus("ready");
      } catch {
        if (!cancelled) {
          setMessages([]);
          setMessageError("대화 내용을 불러오지 못했습니다.");
          setMessageStatus("error");
        }
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [listStatus, selectedSession, selectedSessionId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function refreshSessions() {
    if (!userId) return;
    try {
      const items = await chatApi.sessions(userId);
      setSessions(items);
    } catch {
      setListError("대화방 목록을 새로고침하지 못했습니다.");
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !selectedSession || !userId || isSending) return;

    const previousMessages = messages;
    const pendingMessage: UiChatMessage = {
      id: `pending-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((current) => [
      ...current.filter((message) => !message.isGreeting),
      pendingMessage,
    ]);
    setInput("");
    setSendError("");
    setIsSending(true);

    try {
      const result = await chatApi.send(
        selectedSession.character_id,
        text,
        userId,
        selectedSession.id,
      );
      const assistantMessage: UiChatMessage = {
        id: result.assistant_log_id || `assistant-${Date.now()}`,
        role: "assistant",
        content: result.response,
        conversationLogId: result.assistant_log_id || undefined,
        isFlagged: result.is_flagged,
      };

      setMessages((current) => [...current, assistantMessage]);
      if (result.session_id && result.session_id !== selectedSession.id) {
        router.replace(chatPath(result.session_id));
      }
      refreshSessions();
    } catch {
      setMessages(previousMessages);
      setSendError("메시지를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleDeleteSession(session: ChatSession, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!userId || deletingSessionId) return;

    const confirmed = window.confirm("이 대화방을 삭제할까요?");
    if (!confirmed) return;

    setDeletingSessionId(session.id);
    setDeleteError("");

    try {
      await chatApi.deleteSession(session.id, userId);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      if (selectedSessionId === session.id) {
        setMessages([]);
        setMessageStatus("idle");
        router.push(chatPath());
      }
    } catch {
      setDeleteError("대화방을 삭제하지 못했습니다.");
    } finally {
      setDeletingSessionId("");
    }
  }

  async function handleFeedback(logId: string, feedbackType: FeedbackType) {
    if (!userId) return;

    try {
      await chatApi.feedback({
        conversation_log_id: logId,
        feedback_type: feedbackType,
        user_id: userId,
      });
      setFeedbackByLogId((current) => ({ ...current, [logId]: feedbackType }));
    } catch {
      setSendError("피드백을 저장하지 못했습니다.");
    }
  }

  const isSessionListReady = listStatus === "ready";
  const showEmptySessions = isSessionListReady && sessions.length === 0;
  const canSend = Boolean(selectedSession && userId && messageStatus === "ready" && !isSending);

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="grid content-start gap-4">
        <Card>
          <h1 className="text-2xl font-black tracking-[-0.06em] text-[var(--accent-strong)]">
            내 대화
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            저장된 캐릭터 대화를 선택해 이어갈 수 있습니다.
          </p>
        </Card>

        {listStatus === "loading" ? (
          <Card>
            <p className="text-sm font-bold text-[var(--accent-strong)]">
              대화방을 불러오는 중입니다.
            </p>
          </Card>
        ) : null}

        {listStatus === "missing-user" ? (
          <Card>
            <p className="text-sm font-bold text-[var(--accent-strong)]">
              로그인한 사용자를 확인하지 못했습니다.
            </p>
          </Card>
        ) : null}

        {listStatus === "error" ? (
          <Card>
            <p className="text-sm font-bold text-[var(--accent-strong)]">
              {listError || "대화방 목록을 불러오지 못했습니다."}
            </p>
          </Card>
        ) : null}

        {showEmptySessions ? <EmptySessionState /> : null}

        {isSessionListReady && sessions.length > 0 ? (
          <div className="grid gap-3">
            {deleteError ? (
              <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold text-[var(--accent-strong)]">
                {deleteError}
              </p>
            ) : null}
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isSelected={session.id === selectedSessionId}
                deleteDisabled={deletingSessionId === session.id}
                onOpen={() => {
                  router.push(chatPath(session.id));
                }}
                onDelete={(event) => handleDeleteSession(session, event)}
              />
            ))}
          </div>
        ) : null}
      </aside>

      <section className="overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4">
          {selectedSession ? (
            <>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                {selectedSession.book_title} · {selectedSession.character_name}
              </p>
              <h2 className="mt-1 text-xl font-black leading-7 tracking-[-0.05em] text-[var(--foreground)] sm:text-2xl">
                {selectedSession.title || `${selectedSession.character_name}와의 대화`}
              </h2>
              <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                {selectedSession.character_role || "캐릭터"} · {formatDate(selectedSession.last_active_at)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                Chat Session
              </p>
              <h2 className="mt-1 text-xl font-black leading-7 tracking-[-0.05em] text-[var(--foreground)] sm:text-2xl">
                대화방을 선택해 주세요
              </h2>
            </>
          )}
        </div>

        <div className="grid min-h-[470px] content-start gap-4 p-5">
          {messageStatus === "idle" && !selectedSessionId ? (
            <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold text-[var(--muted)]">
              왼쪽 목록에서 이어갈 대화방을 선택하세요.
            </p>
          ) : null}

          {messageStatus === "loading" ? (
            <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold text-[var(--accent-strong)]">
              대화 내용을 불러오는 중입니다.
            </p>
          ) : null}

          {messageStatus === "not-found" ? (
            <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-4">
              <p className="text-sm font-bold text-[var(--accent-strong)]">
                {messageError || "대화방을 찾을 수 없습니다."}
              </p>
              <button
                type="button"
                className="w-fit rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-black text-white"
                onClick={() => router.push(chatPath())}
              >
                목록으로 돌아가기
              </button>
            </div>
          ) : null}

          {messageStatus === "error" ? (
            <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold text-[var(--accent-strong)]">
              {messageError || "대화 내용을 불러오지 못했습니다."}
            </p>
          ) : null}

          {messageStatus === "ready" && messages.length === 0 ? (
            <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold text-[var(--muted)]">
              아직 메시지가 없습니다.
            </p>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className="grid">
              <ChatBubble message={message} />
              {selectedSession &&
              userId &&
              message.role === "assistant" &&
              message.conversationLogId &&
              !message.isGreeting ? (
                <FeedbackActions
                  logId={message.conversationLogId}
                  characterId={selectedSession.character_id}
                  selected={feedbackByLogId[message.conversationLogId] ?? ""}
                  onFeedback={handleFeedback}
                />
              ) : null}
            </div>
          ))}

          {isSending ? <AssistantTypingBubble /> : null}
          {sendError ? (
            <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-bold text-[var(--accent-strong)]">
              {sendError}
            </p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <ChatInputBar
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={!canSend}
        />
      </section>
    </div>
  );
}
