"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  adminBooksApi,
  adminCharactersApi,
  adminPersonasApi,
  chatApi,
  type ApiError,
  type BookResponse,
  type CharacterResponse,
  type PersonaResponse,
} from "@/lib/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  category?: "story" | "counseling" | "forbidden";
};

const CATEGORY_LABEL = {
  story: "스토리",
  counseling: "상담",
  forbidden: "금지",
} as const;

const CATEGORY_STYLE = {
  story: "border-[#b9dfca] bg-[#eefaf3] text-[#3d8a5e]",
  counseling: "border-[#d8d1f0] bg-[#f4f0ff] text-[#6556a8]",
  forbidden: "border-[#f0c0c0] bg-[#fff0f0] text-[#b04040]",
} as const;

function getGreetingMessage(
  character: CharacterResponse,
  persona?: PersonaResponse | null
): ChatMessage {
  const greeting =
    persona?.greeting_open?.trim() ||
    `${character.name} 캐릭터 테스트를 시작합니다. 첫 질문을 입력해 주세요.`;

  return {
    id: `greeting-${character.id}`,
    role: "assistant",
    content: greeting,
  };
}

function getErrorMessage(error: unknown) {
  const apiError = error as ApiError;
  const maybeError = apiError?.data?.error;
  const maybeDetail = apiError?.data?.detail;
  if (typeof maybeError === "string" && typeof maybeDetail === "string") {
    return `${maybeError} (${maybeDetail})`;
  }
  if (typeof maybeError === "string") return maybeError;
  if (error instanceof Error) return error.message;
  return "요청을 처리하지 못했습니다.";
}

export default function Page() {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [characters, setCharacters] = useState<CharacterResponse[]>([]);
  const [personasByCharacterId, setPersonasByCharacterId] = useState<
    Record<number, PersonaResponse | null>
  >({});
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isBooksLoading, setIsBooksLoading] = useState(true);
  const [isCharactersLoading, setIsCharactersLoading] = useState(false);
  const [isPersonaLoading, setIsPersonaLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsBooksLoading(true);
    adminBooksApi
      .list()
      .then(setBooks)
      .catch((error) => setErrorMessage(getErrorMessage(error)))
      .finally(() => setIsBooksLoading(false));
  }, []);

  useEffect(() => {
    if (selectedBookId == null) {
      setCharacters([]);
      return;
    }

    setIsCharactersLoading(true);
    adminCharactersApi
      .list(selectedBookId)
      .then(setCharacters)
      .catch((error) => setErrorMessage(getErrorMessage(error)))
      .finally(() => setIsCharactersLoading(false));
  }, [selectedBookId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? null,
    [books, selectedBookId]
  );
  const selectedCharacter = useMemo(
    () =>
      characters.find((character) => character.id === selectedCharacterId) ??
      null,
    [characters, selectedCharacterId]
  );
  const selectedPersona =
    selectedCharacterId == null
      ? null
      : personasByCharacterId[selectedCharacterId] ?? null;

  const handleBookSelect = (bookId: number) => {
    setSelectedBookId(bookId);
    setSelectedCharacterId(null);
    setMessages([]);
    setInputValue("");
    setErrorMessage(null);
  };

  const handleCharacterSelect = async (character: CharacterResponse) => {
    setSelectedCharacterId(character.id);
    setInputValue("");
    setErrorMessage(null);

    let persona = personasByCharacterId[character.id];
    if (persona === undefined) {
      setIsPersonaLoading(true);
      try {
        const personas = await adminPersonasApi.list(character.id);
        persona = personas[0] ?? null;
        setPersonasByCharacterId((prev) => ({
          ...prev,
          [character.id]: persona ?? null,
        }));
      } catch (error) {
        persona = null;
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsPersonaLoading(false);
      }
    }

    setMessages([getGreetingMessage(character, persona)]);
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || selectedCharacterId == null || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);
    setErrorMessage(null);

    try {
      const result = await chatApi.send({
        character_id: selectedCharacterId,
        user_message: text,
        top_k: 4,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.response,
          category: result.category,
        },
      ]);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    if (!selectedCharacter) return;
    setMessages([getGreetingMessage(selectedCharacter, selectedPersona)]);
    setInputValue("");
    setErrorMessage(null);
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="m-0 text-2xl tracking-tight text-[#7d5ba6]">
          테스트 채팅
        </h3>
        <p className="mt-1.5 text-[13px] text-[#94859d]">
          동화책을 먼저 고르고, 그 책의 캐릭터를 선택해 실제 챗봇 API를 테스트합니다.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-3 rounded-2xl border border-[#f0c0c0] bg-[#fff0f0] px-3 py-2 text-[12px] font-bold text-[#b04040]">
          {errorMessage}
        </div>
      )}

      <div className="flex h-[calc(100vh-160px)] min-h-[560px] gap-3">
        <aside className="flex w-[280px] shrink-0 flex-col gap-3">
          <section className="rounded-3xl border border-[#eadcf0] bg-white p-3 shadow-[0_6px_16px_rgba(180,140,205,0.1)]">
            <div className="mb-2 flex items-center justify-between">
              <p className="m-0 text-[11px] font-bold text-[#9b74ad]">
                1. 동화책 선택
              </p>
              <span className="text-[10px] text-[#94859d]">
                {books.length}권
              </span>
            </div>
            <div className="grid max-h-[220px] gap-1.5 overflow-y-auto pr-1">
              {isBooksLoading ? (
                <p className="py-4 text-center text-[11px] text-[#94859d]">
                  불러오는 중입니다.
                </p>
              ) : books.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-[#94859d]">
                  등록된 동화책이 없습니다.
                </p>
              ) : (
                books.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => handleBookSelect(book.id)}
                    className={`w-full rounded-2xl px-2.5 py-2 text-left text-[11px] transition-colors ${
                      selectedBookId === book.id
                        ? "bg-gradient-to-br from-[#ffd6ea] to-[#d9c7ff] font-bold text-[#6b4b82]"
                        : "border border-[#eadcf0] bg-[#faf8fc] text-[#78647f]"
                    }`}
                  >
                    <span className="block truncate">{book.title}</span>
                    <span className="block truncate text-[10px] opacity-75">
                      {book.author} · 캐릭터 {book.character_count}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="flex-1 overflow-hidden rounded-3xl border border-[#eadcf0] bg-white p-3 shadow-[0_6px_16px_rgba(180,140,205,0.1)]">
            <div className="mb-2 flex items-center justify-between">
              <p className="m-0 text-[11px] font-bold text-[#9b74ad]">
                2. 캐릭터 선택
              </p>
              <span className="text-[10px] text-[#94859d]">
                {characters.length}명
              </span>
            </div>
            {!selectedBookId ? (
              <p className="py-5 text-center text-[11px] text-[#94859d]">
                동화책을 먼저 선택해 주세요.
              </p>
            ) : isCharactersLoading ? (
              <p className="py-5 text-center text-[11px] text-[#94859d]">
                캐릭터를 불러오는 중입니다.
              </p>
            ) : characters.length === 0 ? (
              <p className="py-5 text-center text-[11px] text-[#94859d]">
                이 동화책에는 캐릭터가 없습니다.
              </p>
            ) : (
              <div className="grid max-h-full gap-1.5 overflow-y-auto pr-1">
                {characters.map((character) => (
                  <button
                    key={character.id}
                    type="button"
                    onClick={() => handleCharacterSelect(character)}
                    className={`flex w-full items-center gap-2 rounded-2xl px-2.5 py-2 text-left transition-colors ${
                      selectedCharacterId === character.id
                        ? "bg-gradient-to-br from-[#ffd6ea] to-[#d9c7ff] font-bold text-[#6b4b82]"
                        : "border border-[#eadcf0] bg-[#faf8fc] text-[#78647f]"
                    }`}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f7ecfb] text-base">
                      {character.profile_image_url ? (
                        <img
                          src={character.profile_image_url}
                          alt={character.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        character.emoji || "★"
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px]">
                        {character.name}
                      </span>
                      <span className="block truncate text-[10px] opacity-75">
                        {character.role || "역할 미입력"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>

        <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-[#eadcf0] bg-white shadow-[0_10px_26px_rgba(180,140,205,0.13)]">
          {!selectedCharacter ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-[13px] text-[#94859d]">
              왼쪽에서 동화책과 캐릭터를 선택하면 테스트 대화가 시작됩니다.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-[#eadcf0] bg-gradient-to-r from-[#fff7fb] to-[#f4efff] px-4 py-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] text-xl">
                  {selectedCharacter.profile_image_url ? (
                    <img
                      src={selectedCharacter.profile_image_url}
                      alt={selectedCharacter.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    selectedCharacter.emoji || "★"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <b className="truncate text-[14px] text-[#72508c]">
                      {selectedCharacter.name}
                    </b>
                    <span className="truncate text-[10px] text-[#94859d]">
                      {selectedCharacter.role || "역할 미입력"} · {selectedBook?.title}
                    </span>
                  </div>
                  <p className="m-0 truncate text-[10px] text-[#94859d]">
                    {isPersonaLoading
                      ? "페르소나를 확인하는 중입니다."
                      : selectedPersona?.speech_style || "등록된 말투가 있으면 응답에 반영됩니다."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full border border-[#eadcf0] bg-white px-3 py-2 text-[11px] font-bold text-[#8b69a3]"
                >
                  초기화
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[72%] rounded-2xl px-3 py-2.5 text-[12px] leading-relaxed ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-[#9477cf] to-[#d56fae] text-white"
                          : "border border-[#f0d9ff] bg-gradient-to-br from-[#fff0f7] to-[#f7e9ff] text-[#6d5f72]"
                      }`}
                    >
                      {message.content}
                      {message.category && (
                        <span
                          className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            CATEGORY_STYLE[message.category]
                          }`}
                        >
                          {CATEGORY_LABEL[message.category]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-[#f0d9ff] bg-gradient-to-br from-[#fff0f7] to-[#f7e9ff] px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9477cf] [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9477cf] [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9477cf] [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-[#eadcf0] px-4 py-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`${selectedCharacter.name}에게 테스트 질문을 입력하세요.`}
                    disabled={isSending}
                    className="min-w-0 flex-1 rounded-2xl border border-[#eadcf0] bg-[#faf8fc] px-3 py-2.5 text-[12px] text-[#74617a] outline-none focus:border-[#9477cf] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isSending}
                    className="rounded-full bg-gradient-to-br from-[#9477cf] to-[#d56fae] px-4 py-2.5 text-[12px] font-bold text-white disabled:opacity-40"
                  >
                    전송
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-[#94859d]">
                  금지어는 챗봇 API의 분류와 출력 필터를 통과하며, 캐릭터 선택 시 첫 인삿말은 persona의 시작 인삿말을 사용합니다.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
