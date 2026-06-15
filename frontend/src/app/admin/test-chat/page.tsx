"use client";

import { useRef, useState } from "react";
import {
  mockBooks,
  mockCharacters,
  mockMessagesByCharacterId,
  mockPersonas,
} from "@/data/mock";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const MOCK_RESPONSES: Record<string, string[]> = {
  witch: [
    "흥. 그게 네가 알고 싶은 거야? 좀 더 생각해보고 물어.",
    "거울도 내 마음을 다 비추지는 못해. 네가 그걸 이해할 수 있을지 모르겠지만.",
    "내 과거를 판단하지 마. 나도 그때는 내 방식대로 살았을 뿐이야.",
    "외로움이라는 게 사람을 어떻게 바꾸는지... 너는 알 수 있을까.",
  ],
  "fairy-godmother": [
    "얘야, 마음이 따뜻하면 어떤 어려움도 헤쳐나갈 수 있단다.",
    "걱정 마, 내가 여기 있잖니. 함께라면 무서울 게 없어.",
    "작은 꿈도 소중히 여기렴. 그 꿈이 언젠가 큰 행복이 될 거야.",
    "용기를 낼 때 가장 멋진 마법이 일어난단다.",
  ],
  fox: [
    "우리가 특별해지는 건 서로를 위해 시간을 쓸 때야.",
    "눈으로는 볼 수 없어. 마음으로 봐야 해. 가장 중요한 건 눈에 보이지 않거든.",
    "길들임이란 게 뭔지 조금씩 알아가고 있니?",
    "네가 내게 특별해지려면 시간이 필요해. 서두르지 않아도 돼.",
  ],
  wolf: [
    "어흥! 하지만 걱정 마, 오늘은 이야기만 할 거니까.",
    "숲길은 조심해야 해. 하지만 무서워하기보다는 현명하게 생각해야지.",
    "나는 이야기 속에서 교훈을 만드는 역할이야.",
    "낯선 존재를 무조건 따라가면 안 돼. 판단하는 법을 배우렴.",
  ],
};

const DEFAULT_RESPONSES = [
  "그건 정말 좋은 질문이야.",
  "함께 이야기해서 즐거워.",
  "조금 더 생각해볼게.",
];

function getMockResponse(characterId: string): string {
  const pool = MOCK_RESPONSES[characterId] ?? DEFAULT_RESPONSES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getInitialMessages(characterId: string): ChatMessage[] {
  const raw = mockMessagesByCharacterId[characterId];
  if (!raw) return [];
  return raw.map((m) => ({ ...m }));
}

const APPROVAL_LABEL = {
  approved: "승인됨",
  draft: "검토 중",
  rejected: "반려됨",
} as const;

const APPROVAL_STYLE = {
  approved: "bg-[#e8f9ef] text-[#3d8a5e] border-[#b6e6ca]",
  draft: "bg-[#fff9ec] text-[#9b7a1e] border-[#f0dfa0]",
  rejected: "bg-[#fff0f0] text-[#b04040] border-[#f0c0c0]",
} as const;

export default function Page() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedBook = mockBooks.find((b) => b.id === selectedBookId);
  const filteredCharacters = selectedBook
    ? mockCharacters.filter((c) => c.bookTitle === selectedBook.title)
    : [];
  const selectedCharacter = mockCharacters.find(
    (c) => c.id === selectedCharacterId
  );
  const selectedPersona = mockPersonas.find(
    (p) => p.characterId === selectedCharacterId
  );

  const selectCharacter = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setMessages(getInitialMessages(characterId));
    setInputValue("");
  };

  const handleSend = () => {
    if (!inputValue.trim() || !selectedCharacterId || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: getMockResponse(selectedCharacterId),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }, 800);
  };

  const handleReset = () => {
    if (!selectedCharacterId) return;
    setMessages(getInitialMessages(selectedCharacterId));
    setInputValue("");
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">
          테스트 채팅
        </h3>
        <p className="mt-1.5 text-[13px] text-[#94859d]">
          캐릭터를 선택하고 페르소나 응답을 테스트합니다.
        </p>
      </div>

      <div className="flex gap-3 h-[calc(100vh-160px)] min-h-[560px]">
        {/* Left Panel */}
        <aside className="w-[200px] shrink-0 flex flex-col gap-2.5">
          {/* Book Select */}
          <div className="bg-white border border-[#eadcf0] rounded-3xl p-3 shadow-[0_6px_16px_rgba(180,140,205,0.1)]">
            <p className="text-[11px] font-bold text-[#9b74ad] mb-2">
              동화책 선택
            </p>
            <div className="grid gap-1.5">
              {mockBooks.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => {
                    setSelectedBookId(book.id);
                    setSelectedCharacterId(null);
                    setMessages([]);
                  }}
                  className={`w-full text-left rounded-2xl px-2.5 py-2 text-[11px] transition-colors ${
                    selectedBookId === book.id
                      ? "bg-gradient-to-br from-[#ffd6ea] to-[#d9c7ff] text-[#6b4b82] font-bold"
                      : "bg-[#faf8fc] border border-[#eadcf0] text-[#78647f]"
                  }`}
                >
                  {book.coverEmoji} {book.title}
                </button>
              ))}
            </div>
          </div>

          {/* Character Select */}
          {selectedBookId && (
            <div className="bg-white border border-[#eadcf0] rounded-3xl p-3 shadow-[0_6px_16px_rgba(180,140,205,0.1)] flex-1 overflow-y-auto">
              <p className="text-[11px] font-bold text-[#9b74ad] mb-2">
                캐릭터 선택
              </p>
              {filteredCharacters.length === 0 ? (
                <p className="text-[10px] text-[#94859d] text-center py-3">
                  캐릭터 없음
                </p>
              ) : (
                <div className="grid gap-1.5">
                  {filteredCharacters.map((character) => (
                    <button
                      key={character.id}
                      type="button"
                      onClick={() => selectCharacter(character.id)}
                      className={`w-full text-left rounded-2xl px-2.5 py-2 transition-colors ${
                        selectedCharacterId === character.id
                          ? "bg-gradient-to-br from-[#ffd6ea] to-[#d9c7ff] text-[#6b4b82] font-bold"
                          : "bg-[#faf8fc] border border-[#eadcf0] text-[#78647f]"
                      }`}
                    >
                      <span className="text-base mr-1.5">
                        {character.avatarEmoji}
                      </span>
                      <span className="text-[11px]">{character.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Right Panel - Chat */}
        <div className="flex-1 flex flex-col bg-white border border-[#eadcf0] rounded-3xl shadow-[0_10px_26px_rgba(180,140,205,0.13)] overflow-hidden">
          {!selectedCharacterId ? (
            <div className="flex-1 flex items-center justify-center text-[13px] text-[#94859d]">
              좌측에서 동화책과 캐릭터를 선택하세요.
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#eadcf0] bg-gradient-to-r from-[#fff7fb] to-[#f4efff]">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] grid place-items-center text-xl shrink-0">
                  {selectedCharacter?.avatarEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <b className="text-[14px] text-[#72508c]">
                      {selectedCharacter?.name}
                    </b>
                    <span className="text-[10px] text-[#94859d]">
                      {selectedCharacter?.role} · {selectedBook?.title}
                    </span>
                    {selectedPersona && (
                      <span
                        className={`border rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          APPROVAL_STYLE[selectedPersona.approvalStatus]
                        }`}
                      >
                        {APPROVAL_LABEL[selectedPersona.approvalStatus]}
                      </span>
                    )}
                  </div>
                  {selectedPersona && (
                    <p className="text-[10px] text-[#94859d] m-0 truncate">
                      {selectedPersona.speechStyle} ·{" "}
                      &ldquo;{selectedPersona.catchphrase}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] grid place-items-center text-sm mr-1.5 shrink-0 self-end">
                        {selectedCharacter?.avatarEmoji}
                      </div>
                    )}
                    <div
                      className={`max-w-[72%] rounded-2xl px-3 py-2.5 text-[12px] leading-relaxed ${
                        msg.role === "user"
                          ? "text-white bg-gradient-to-br from-[#c7a6ff] to-[#f2a7d7]"
                          : "bg-gradient-to-br from-[#fff0f7] to-[#f7e9ff] border border-[#f0d9ff] text-[#6d5f72]"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] grid place-items-center text-sm mr-1.5 shrink-0 self-end">
                      {selectedCharacter?.avatarEmoji}
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-gradient-to-br from-[#fff0f7] to-[#f7e9ff] border border-[#f0d9ff]">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c7a8ff] animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c7a8ff] animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c7a8ff] animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-[#eadcf0]">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`${selectedCharacter?.name}에게 말을 걸어보세요...`}
                    disabled={isLoading}
                    className="flex-1 bg-[#faf8fc] border border-[#eadcf0] rounded-2xl text-[12px] text-[#74617a] px-3 py-2.5 outline-none focus:border-[#c7a8ff] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] disabled:opacity-40"
                  >
                    전송
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full px-3.5 py-2 text-[11px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0]"
                  >
                    다시 테스트
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      console.log("배포 승인:", selectedCharacterId)
                    }
                    className="rounded-full px-3.5 py-2 text-[11px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2]"
                  >
                    배포 승인
                  </button>
                  <button
                    type="button"
                    onClick={() => console.log("반려:", selectedCharacterId)}
                    className="rounded-full px-3.5 py-2 text-[11px] font-bold text-[#b04040] bg-white border border-[#f0c0c0]"
                  >
                    반려
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
