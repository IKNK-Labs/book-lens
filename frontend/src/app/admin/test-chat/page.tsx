"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  adminBooksApi,
  adminCharactersApi,
  adminPersonasApi,
  chatApi,
  type ApprovalStatus,
  type BookResponse,
  type CharacterResponse,
  type PersonaResponse,
} from "@/lib/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tag?: string;
};

const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  approved: "승인됨",
  draft: "검토 중",
  rejected: "반려됨",
};

const APPROVAL_STYLE: Record<ApprovalStatus, string> = {
  approved: "bg-[#e8f9ef] text-[#3d8a5e] border-[#b6e6ca]",
  draft: "bg-[#fff9ec] text-[#9b7a1e] border-[#f0dfa0]",
  rejected: "bg-[#fff0f0] text-[#b04040] border-[#f0c0c0]",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function getCharacterAvatar(character?: CharacterResponse | null) {
  if (!character) return "?";
  return character.emoji || character.name.slice(0, 1) || "?";
}

function CharacterAvatar({
  character,
  size = "md",
}: {
  character?: CharacterResponse | null;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-9 w-9 rounded-2xl" : "h-12 w-12 rounded-[20px]";
  const textClass = size === "sm" ? "text-base" : "text-xl";

  return (
    <div
      className={`${sizeClass} grid place-items-center shrink-0 overflow-hidden border border-[#eadcf0] bg-gradient-to-br from-[#fff7d8] via-[#f6d7ff] to-[#d9c8ff] shadow-[0_4px_12px_rgba(150,110,180,0.12)]`}
    >
      {character?.profile_image_url ? (
        <img
          src={character.profile_image_url}
          alt={character.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={textClass}>{getCharacterAvatar(character)}</span>
      )}
    </div>
  );
}

export default function Page() {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [characters, setCharacters] = useState<CharacterResponse[]>([]);
  const [personasByCharacterId, setPersonasByCharacterId] = useState<
    Record<number, PersonaResponse | null>
  >({});
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedBook = books.find((book) => book.id === selectedBookId) ?? null;
  const selectedCharacter =
    characters.find((character) => character.id === selectedCharacterId) ?? null;
  const selectedPersona =
    selectedCharacterId == null ? null : personasByCharacterId[selectedCharacterId] ?? null;

  const chatDisabled = !selectedCharacter || isSending || isLoadingGreeting;
  const statusText = useMemo(() => {
    if (isLoadingGreeting) return "첫 인사말을 불러오는 중입니다.";
    if (isSending) return "챗봇 API 응답을 기다리는 중입니다.";
    if (!selectedCharacter) return "동화책과 캐릭터를 선택하면 테스트를 시작할 수 있습니다.";
    return "금지어는 챗봇 API의 분류와 출력 필터를 통과하며, 캐릭터 선택 시 첫 인사말은 persona의 시작 인사말을 사용합니다.";
  }, [isLoadingGreeting, isSending, selectedCharacter]);

  useEffect(() => {
    setIsLoadingBooks(true);
    adminBooksApi
      .list()
      .then((items) => {
        setBooks(items);
        setSelectedBookId((prev) => prev ?? items[0]?.id ?? null);
      })
      .catch((error) => {
        setErrorMessage(getErrorMessage(error, "동화책 목록을 불러오지 못했습니다."));
      })
      .finally(() => setIsLoadingBooks(false));
  }, []);

  useEffect(() => {
    if (selectedBookId == null) {
      setCharacters([]);
      setSelectedCharacterId(null);
      setMessages([]);
      return;
    }

    setIsLoadingCharacters(true);
    setErrorMessage("");
    adminCharactersApi
      .list(selectedBookId)
      .then((items) => {
        setCharacters(items);
        setSelectedCharacterId(null);
        setMessages([]);
      })
      .catch((error) => {
        setCharacters([]);
        setErrorMessage(getErrorMessage(error, "캐릭터 목록을 불러오지 못했습니다."));
      })
      .finally(() => setIsLoadingCharacters(false));
  }, [selectedBookId]);

  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const selectBook = (bookId: number) => {
    setSelectedBookId(bookId);
    setSelectedCharacterId(null);
    setInputValue("");
    setErrorMessage("");
  };

  const loadPersona = async (characterId: number) => {
    if (personasByCharacterId[characterId] !== undefined) return;

    const personas = await adminPersonasApi.list(characterId);
    setPersonasByCharacterId((prev) => ({
      ...prev,
      [characterId]: personas[0] ?? null,
    }));
  };

  const selectCharacter = async (character: CharacterResponse) => {
    setSelectedCharacterId(character.id);
    setInputValue("");
    setErrorMessage("");
    setMessages([]);
    setIsLoadingGreeting(true);

    try {
      await loadPersona(character.id);
      const greeting = await chatApi.greeting(character.id);
      setMessages([
        {
          id: `greeting-${character.id}-${Date.now()}`,
          role: "assistant",
          content: greeting.greeting,
        },
      ]);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "첫 인사말을 불러오지 못했습니다."));
      setMessages([
        {
          id: `fallback-${character.id}-${Date.now()}`,
          role: "assistant",
          content: `안녕! 나는 ${character.name}이야. 테스트 질문을 입력해줘.`,
        },
      ]);
    } finally {
      setIsLoadingGreeting(false);
    }
  };

  const handleReset = () => {
    if (!selectedCharacter) return;
    void selectCharacter(selectedCharacter);
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !selectedCharacter || chatDisabled) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);
    setErrorMessage("");

    try {
      const result = await chatApi.send(selectedCharacter.id, text);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.response,
          tag: result.is_flagged ? "필터 감지" : undefined,
        },
      ]);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "챗봇 API 호출에 실패했습니다."));
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "응답을 받아오지 못했습니다. 서버 상태와 API 설정을 확인해주세요.",
          tag: "오류",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h3 className="m-0 text-[26px] font-semibold tracking-tight text-[#7d5ba6]">
          테스트 채팅
        </h3>
        <p className="mt-2 text-[13px] text-[#8d7b99]">
          동화책을 먼저 고르고, 그 책의 캐릭터를 선택해 실제 챗봇 API를 테스트합니다.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-3 rounded-2xl border border-[#f0c0c0] bg-[#fff7f7] px-4 py-3 text-[12px] font-semibold text-[#b04040]">
          {errorMessage}
        </div>
      )}

      <div className="flex min-h-[560px] h-[calc(100vh-165px)] gap-3">
        <aside className="flex w-[330px] shrink-0 flex-col gap-3">
          <section className="min-h-0 flex-[0.9] rounded-[26px] border border-[#eadcf0] bg-white p-3 shadow-[0_10px_28px_rgba(168,130,190,0.12)]">
            <div className="mb-3 flex items-center justify-between px-1">
              <b className="text-[12px] text-[#9b74ad]">1. 동화책 선택</b>
              <span className="text-[11px] text-[#a48faf]">{books.length}권</span>
            </div>
            <div className="grid max-h-full gap-2 overflow-y-auto pr-1">
              {isLoadingBooks ? (
                <p className="py-8 text-center text-[12px] text-[#94859d]">불러오는 중...</p>
              ) : books.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-[#94859d]">
                  등록된 동화책이 없습니다.
                </p>
              ) : (
                books.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => selectBook(book.id)}
                    className={`min-h-[62px] rounded-[18px] border px-3 py-2 text-left transition ${
                      selectedBookId === book.id
                        ? "border-[#dcb9f2] bg-gradient-to-r from-[#ffe3f7] to-[#dec3ff] shadow-[0_8px_18px_rgba(185,130,210,0.16)]"
                        : "border-[#eadcf0] bg-[#fbf9fd] hover:border-[#d9c3e8]"
                    }`}
                  >
                    <span className="block truncate text-[18px] font-semibold text-[#76548d]">
                      {book.title}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-[#98869f]">
                      {book.author} · 캐릭터 {book.character_count}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="min-h-0 flex-1 rounded-[26px] border border-[#eadcf0] bg-white p-3 shadow-[0_10px_28px_rgba(168,130,190,0.12)]">
            <div className="mb-3 flex items-center justify-between px-1">
              <b className="text-[12px] text-[#9b74ad]">2. 캐릭터 선택</b>
              <span className="text-[11px] text-[#a48faf]">{characters.length}명</span>
            </div>
            <div className="grid max-h-full gap-2 overflow-y-auto pr-1">
              {!selectedBookId ? (
                <p className="py-8 text-center text-[12px] text-[#94859d]">
                  동화책을 먼저 선택하세요.
                </p>
              ) : isLoadingCharacters ? (
                <p className="py-8 text-center text-[12px] text-[#94859d]">불러오는 중...</p>
              ) : characters.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-[#94859d]">
                  이 책에 등록된 캐릭터가 없습니다.
                </p>
              ) : (
                characters.map((character) => (
                  <button
                    key={character.id}
                    type="button"
                    onClick={() => void selectCharacter(character)}
                    className={`flex min-h-[56px] items-center gap-3 rounded-[18px] border px-3 py-2 text-left transition ${
                      selectedCharacterId === character.id
                        ? "border-[#dcb9f2] bg-gradient-to-r from-[#ffe3f7] to-[#dec3ff] shadow-[0_8px_18px_rgba(185,130,210,0.16)]"
                        : "border-[#eadcf0] bg-[#fbf9fd] hover:border-[#d9c3e8]"
                    }`}
                  >
                    <CharacterAvatar character={character} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-[#76548d]">
                        {character.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[#98869f]">
                        {character.role || "역할 미등록"}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-[#eadcf0] bg-white shadow-[0_14px_34px_rgba(168,130,190,0.14)]">
          {selectedCharacter ? (
            <>
              <div className="flex items-center gap-3 border-b border-[#eadcf0] bg-gradient-to-r from-[#fff7fb] to-[#f6efff] px-5 py-3">
                <CharacterAvatar character={selectedCharacter} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-[17px] text-[#72508c]">{selectedCharacter.name}</b>
                    <span className="text-[11px] text-[#91809a]">
                      {selectedCharacter.role || "역할 미등록"} · {selectedBook?.title}
                    </span>
                    {selectedPersona?.approved_status && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          APPROVAL_STYLE[selectedPersona.approved_status]
                        }`}
                      >
                        {APPROVAL_LABEL[selectedPersona.approved_status]}
                      </span>
                    )}
                  </div>
                  <p className="m-0 mt-1 truncate text-[11px] text-[#94859d]">
                    {selectedPersona?.speech_style ||
                      selectedCharacter.description ||
                      "페르소나 말투 정보가 아직 없습니다."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoadingGreeting || isSending}
                  className="rounded-full border border-[#eadcf0] bg-white px-4 py-2 text-[16px] font-semibold text-[#8b69a3] shadow-[0_5px_14px_rgba(150,110,180,0.08)] disabled:opacity-50"
                >
                  초기화
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="flex flex-col gap-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-[18px] px-4 py-3 text-[13px] leading-7 ${
                          message.role === "user"
                            ? "bg-[#b56bcb] text-white shadow-[0_7px_16px_rgba(165,100,190,0.22)]"
                            : "border border-[#efd5fa] bg-[#fff1ff] text-[#6d5f72]"
                        }`}
                      >
                        {message.content}
                        {message.tag && (
                          <span className="ml-2 inline-flex rounded-full border border-[#b6e6ca] bg-[#e8f9ef] px-2 py-0.5 text-[10px] font-bold text-[#3d8a5e]">
                            {message.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {(isLoadingGreeting || isSending) && (
                    <div className="flex justify-start">
                      <div className="rounded-[18px] border border-[#efd5fa] bg-[#fff1ff] px-4 py-3">
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b56bcb]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b56bcb] [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b56bcb] [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t border-[#eadcf0] px-5 py-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder={`${selectedCharacter.name}에게 테스트 질문을 입력하세요.`}
                    disabled={chatDisabled}
                    className="min-h-[50px] flex-1 rounded-[18px] border border-[#eadcf0] bg-[#fbf9fd] px-4 text-[16px] text-[#74617a] outline-none transition placeholder:text-[#b5aabc] focus:border-[#c7a8ff] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!inputValue.trim() || chatDisabled}
                    className="min-h-[50px] rounded-[22px] bg-[#d7b4e2] px-6 text-[16px] font-bold text-white transition hover:bg-[#c997d9] disabled:opacity-45"
                  >
                    전송
                  </button>
                </div>
                <p className="m-0 mt-3 text-[11px] text-[#94859d]">{statusText}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-[13px] text-[#94859d]">
              왼쪽에서 동화책과 캐릭터를 선택하면 실제 챗봇 API 테스트를 시작합니다.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
