"use client";

import { useEffect, useRef, useState } from "react";
import { chatApi, type GreetingResponse } from "../../lib/api";
import { Card } from "../ui/Card";
import { ChatBubble } from "./ChatBubble";
import { ChatInputBar } from "./ChatInputBar";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
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
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {info.has_history ? "이전 대화를 이어가고 있어요." : "처음 만나는 캐릭터예요."}
        </p>
      </div>
    </Card>
  );
}

export function CharacterChatShell({ characterId }: { characterId: string }) {
  const numericId = Number(characterId);

  const [characterInfo, setCharacterInfo] = useState<GreetingResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!numericId) {
      setLoadError("잘못된 캐릭터 ID입니다.");
      return;
    }

    chatApi
      .greeting(numericId)
      .then((info) => {
        setCharacterInfo(info);
        setMessages([
          {
            id: "greeting",
            role: "assistant",
            content: info.greeting,
          },
        ]);
      })
      .catch(() => setLoadError("캐릭터 정보를 불러오지 못했습니다."));
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
      const res = await chatApi.send(numericId, text);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.response,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  if (loadError) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">{loadError}</p>
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
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="grid gap-4 self-start">
        <CharacterSidePanel info={characterInfo} />
      </aside>
      <section className="overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4">
          <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--foreground)]">
            {characterInfo.character_name}와의 대화
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {isSending ? "응답을 기다리는 중..." : "메시지를 입력해 대화를 이어가 보세요."}
          </p>
        </div>
        <div className="grid min-h-[440px] content-start gap-4 p-5">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          <div ref={bottomRef} />
        </div>
        <ChatInputBar
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isSending}
        />
      </section>
    </div>
  );
}
