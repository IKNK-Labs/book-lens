"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  booksApi,
  chatApi,
  type BookResponse,
  type CharacterItem,
  type FeedbackType,
  type GreetingResponse,
} from "../../lib/api";
import { createClient } from "../../lib/supabase/client";
import { Card } from "../ui/Card";
import { ChatBubble } from "./ChatBubble";
import { ChatInputBar } from "./ChatInputBar";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  conversationLogId?: string;
};

function CharacterSidePanel({ info }: { info: GreetingResponse }) {
  return (
    <Card>
      <div className="overflow-hidden rounded-[26px]">
        {info.character_profile_image_url ? (
          <img
            src={info.character_profile_image_url}
            alt={info.character_name}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="grid place-items-center bg-gradient-to-br from-[var(--surface-soft)] via-[var(--accent-soft)] to-[var(--surface-muted)] p-8 text-7xl">
            {info.character_emoji ?? "📖"}
          </div>
        )}
      </div>
      <div className="mt-5">
        <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[var(--accent-strong)]">
          {info.character_name}
        </h1>
        <p className="mt-1 text-sm font-black text-[var(--accent)]">
          {info.character_role ?? "캐릭터"} · {info.book_title}
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {info.has_history ? "이전 대화를 이어가고 있어요." : "처음 만나는 캐릭터예요."}
        </p>
      </div>
    </Card>
  );
}

function AssistantTypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 shadow-sm">
        <div className="flex gap-1.5" aria-label="봇 응답 생성 중">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function ChatCharacterPicker({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"books" | "characters">("books");
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookResponse | null>(null);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    booksApi
      .list()
      .then((items) => {
        if (cancelled) return;
        setBooks(items);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("동화책 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBooks(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleBookSelect(book: BookResponse) {
    if (disabled || isLoadingCharacters) return;

    setSelectedBook(book);
    setCharacters([]);
    setIsLoadingCharacters(true);
    setError("");

    try {
      const items = await booksApi.characters(book.id);
      setCharacters(items);
      setMode("characters");
    } catch {
      setError("캐릭터 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoadingCharacters(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">
            {mode === "books" ? "Book Select" : "Character Select"}
          </p>
          <h2 className="mt-1 text-lg font-black text-[var(--accent-strong)]">
            {mode === "books" ? "동화책 선택" : "캐릭터 선택"}
          </h2>
        </div>
        {mode === "characters" ? (
          <button
            type="button"
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-black text-[var(--accent-strong)]"
            onClick={() => {
              setMode("books");
              setCharacters([]);
              setSelectedBook(null);
            }}
          >
            뒤로가기
          </button>
        ) : null}
      </div>

      {disabled ? (
        <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold text-[var(--muted)]">
          캐릭터 대화가 준비되면 다른 캐릭터를 선택할 수 있어요.
        </p>
      ) : error ? (
        <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold text-[var(--accent-strong)]">
          {error}
        </p>
      ) : null}

      {mode === "books" ? (
        <div className="mt-3 grid max-h-[360px] gap-2 overflow-auto pr-1">
          {isLoadingBooks ? (
            <p className="text-sm font-bold text-[var(--muted)]">동화책을 불러오는 중입니다.</p>
          ) : books.length > 0 ? (
            books.map((book) => (
              <button
                key={book.id}
                type="button"
                disabled={disabled}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-left transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => handleBookSelect(book)}
              >
                <b className="block truncate text-sm text-[var(--accent-strong)]">{book.title}</b>
                <span className="mt-1 block truncate text-xs font-bold text-[var(--muted)]">
                  {book.author} · 캐릭터 {book.character_count}명
                </span>
              </button>
            ))
          ) : (
            <p className="text-sm font-bold text-[var(--muted)]">등록된 동화책이 없습니다.</p>
          )}
        </div>
      ) : (
        <div className="mt-3 grid max-h-[360px] gap-2 overflow-auto pr-1">
          {isLoadingCharacters ? (
            <p className="text-sm font-bold text-[var(--muted)]">캐릭터를 불러오는 중입니다.</p>
          ) : characters.length > 0 ? (
            characters.map((character) => (
              <button
                key={character.id}
                type="button"
                className="grid grid-cols-[44px_1fr] items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-3 text-left transition hover:border-[var(--accent)]"
                onClick={() => router.push(`/chat/${character.id}`)}
              >
                <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-[var(--accent-soft)] text-xl">
                  {character.profile_image_url ? (
                    <img src={character.profile_image_url} alt={character.name} className="h-full w-full object-cover" />
                  ) : (
                    character.emoji ?? "📖"
                  )}
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-sm text-[var(--accent-strong)]">{character.name}</b>
                  <span className="mt-1 block truncate text-xs font-bold text-[var(--muted)]">
                    {selectedBook?.title} · {character.role ?? "캐릭터"}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="text-sm font-bold text-[var(--muted)]">이 동화책에 등록된 캐릭터가 없습니다.</p>
          )}
        </div>
      )}
    </Card>
  );
}

export function CharacterChatShell({ characterId }: { characterId: string }) {
  const router = useRouter();
  const numericId = Number(characterId);

  const [characterInfo, setCharacterInfo] = useState<GreetingResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [lastAssistantLogId, setLastAssistantLogId] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | "">("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!numericId) {
      return;
    }

    let cancelled = false;

    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const uid = data.user?.id;
        setUserId(uid);
        return chatApi.greeting(numericId, uid);
      })
      .then((info) => {
        if (cancelled) return;
        setCharacterInfo(info);
        setMessages([
          {
            id: "greeting",
            role: "assistant",
            content: info.greeting,
            conversationLogId: info.assistant_log_id,
          },
        ]);
        setLastAssistantLogId(info.assistant_log_id);
        setSelectedFeedback("");
      })
      .catch(() => {
        if (!cancelled) setLoadError("캐릭터 정보를 불러오지 못했습니다.");
      });

    return () => { cancelled = true; };
  }, [numericId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await chatApi.send(numericId, text, userId);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.response,
        conversationLogId: res.assistant_log_id,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLastAssistantLogId(res.assistant_log_id);
      setSelectedFeedback("");
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleFeedback(feedbackType: FeedbackType) {
    if (!lastAssistantLogId || !userId) return;

    try {
      await chatApi.feedback({
        conversation_log_id: lastAssistantLogId,
        feedback_type: feedbackType,
        user_id: userId,
      });
      setSelectedFeedback(feedbackType);
    } catch {
      // Keep feedback controls quiet; the user can retry by pressing again.
    }
  }

  if (!numericId || loadError) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">{loadError || "잘못된 캐릭터 ID입니다."}</p>
      </Card>
    );
  }

  if (!characterInfo) {
    return (
      <Card>
        <p className="text-sm font-bold text-[var(--accent-strong)]">캐릭터 정보를 불러오는 중입니다.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
      <aside className="grid gap-4 self-start">
        <CharacterSidePanel info={characterInfo} />
      </aside>
      <section className="overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--foreground)]">
              {characterInfo.character_name}({characterInfo.character_role ?? "캐릭터"} · {characterInfo.book_title})
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {isSending ? "응답을 기다리는 중..." : "메시지를 입력해 대화를 이어가 보세요."}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-full border px-3 py-2 text-xs font-black transition ${
                selectedFeedback === "like"
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] text-[var(--accent-strong)] hover:border-[var(--accent)]"
              }`}
              onClick={() => handleFeedback("like")}
            >
              좋아요
            </button>
            <button
              type="button"
              className={`rounded-full border px-3 py-2 text-xs font-black transition ${
                selectedFeedback === "dislike"
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] text-[var(--accent-strong)] hover:border-[var(--accent)]"
              }`}
              onClick={() => handleFeedback("dislike")}
            >
              싫어요
            </button>
            <button
              type="button"
              className="rounded-full border border-[var(--line)] px-3 py-2 text-xs font-black text-[var(--accent-strong)] transition hover:border-[var(--accent)]"
              onClick={() => {
                router.push(
                  `/chat/${numericId}/report${lastAssistantLogId ? `?log=${encodeURIComponent(lastAssistantLogId)}` : ""}`,
                );
              }}
            >
              신고
            </button>
          </div>
        </div>
        <div className="grid min-h-[440px] content-start gap-4 p-5">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {isSending ? <AssistantTypingBubble /> : null}
          <div ref={bottomRef} />
        </div>
        <ChatInputBar
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isSending}
        />
      </section>
      <aside className="self-start">
        <ChatCharacterPicker disabled={!lastAssistantLogId} />
      </aside>
    </div>
  );
}
