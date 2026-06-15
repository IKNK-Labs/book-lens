"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import CharacterCard from "@/components/admin/CharacterCard";
import { mockPersonas, type Persona } from "@/data/mock";
import {
  adminBooksApi,
  adminCharactersApi,
  type BookResponse,
  type CharacterPayload,
  type CharacterResponse,
} from "@/lib/api";

type PersonaForm = {
  personality: string;
  speechStyle: string;
  catchphrase: string;
  greetingStart: string;
  greetingEnd: string;
  introduction: string;
  tags: string;
  startingSituation: string;
  historicalBackground: string;
  backgroundDescription: string;
  userRole: string;
  userRelationship: string;
  systemPrompt: string;
  approvalStatus: "draft" | "approved" | "rejected";
};

const EMPTY_CHARACTER: CharacterPayload = {
  book_id: 0,
  name: "",
  role: "",
  gender: "",
  emoji: "",
  description: "",
  profile_image_url: "",
};

const EMPTY_PERSONA_FORM: PersonaForm = {
  personality: "",
  speechStyle: "",
  catchphrase: "",
  greetingStart: "",
  greetingEnd: "",
  introduction: "",
  tags: "",
  startingSituation: "",
  historicalBackground: "",
  backgroundDescription: "",
  userRole: "",
  userRelationship: "",
  systemPrompt: "",
  approvalStatus: "draft",
};

const MOCK_CHARACTER_AUTOCOMPLETE: Record<string, Omit<CharacterPayload, "book_id">> = {
  마녀: {
    name: "마녀",
    role: "악역",
    gender: "여성",
    emoji: "🧙",
    description:
      "백설공주와 일곱 난쟁이 속 마녀. 거울의 말에 상처받고 질투심을 느끼지만, 해로운 행동을 미화하지 않도록 설정합니다.",
  },
  신데렐라: {
    name: "신데렐라",
    role: "주인공",
    gender: "여성",
    emoji: "👸",
    description:
      "계모와 언니들의 구박을 받으면서도 희망을 잃지 않는 착한 마음씨의 주인공입니다.",
  },
};

function getPersonaFormFromMock(characterId: number): PersonaForm {
  const p = mockPersonas.find((m) => m.characterId === String(characterId));
  if (!p) return EMPTY_PERSONA_FORM;
  return {
    personality: p.personality,
    speechStyle: p.speechStyle,
    catchphrase: p.catchphrase,
    greetingStart: p.greetingStart,
    greetingEnd: p.greetingEnd,
    introduction: p.introduction,
    tags: p.tags.join(", "),
    startingSituation: p.startingSituation,
    historicalBackground: p.historicalBackground,
    backgroundDescription: p.backgroundDescription,
    userRole: p.userRole,
    userRelationship: p.userRelationship,
    systemPrompt: p.systemPrompt,
    approvalStatus: p.approvalStatus,
  };
}

const APPROVAL_LABEL: Record<Persona["approvalStatus"], string> = {
  approved: "승인됨",
  draft: "검토 중",
  rejected: "반려됨",
};

const APPROVAL_STYLE: Record<Persona["approvalStatus"], string> = {
  approved: "bg-[#e8f9ef] text-[#3d8a5e] border-[#b6e6ca]",
  draft: "bg-[#fff9ec] text-[#9b7a1e] border-[#f0dfa0]",
  rejected: "bg-[#fff0f0] text-[#b04040] border-[#f0c0c0]",
};

export default function Page() {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [characters, setCharacters] = useState<CharacterResponse[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // character modal
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [characterModalMode, setCharacterModalMode] = useState<"add" | "edit">("add");
  const [characterNameInput, setCharacterNameInput] = useState("");
  const [characterForm, setCharacterForm] = useState<Omit<CharacterPayload, "book_id">>(
    EMPTY_CHARACTER
  );

  // persona modal
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [personaModalMode, setPersonaModalMode] = useState<"add" | "edit">("add");
  const [personaLlmInput, setPersonaLlmInput] = useState("");
  const [personaForm, setPersonaForm] = useState<PersonaForm>(EMPTY_PERSONA_FORM);

  useEffect(() => {
    adminBooksApi.list().then(setBooks).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedBookId == null) {
      setCharacters([]);
      return;
    }
    adminCharactersApi.list(selectedBookId).then(setCharacters).catch(console.error);
  }, [selectedBookId]);

  const selectedBook = books.find((b) => b.id === selectedBookId);
  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);
  const selectedPersona = mockPersonas.find(
    (p) => p.characterId === String(selectedCharacterId)
  );

  const openAddCharacterModal = () => {
    setCharacterModalMode("add");
    setCharacterNameInput("");
    setCharacterForm({ ...EMPTY_CHARACTER });
    setIsCharacterModalOpen(true);
  };

  const openEditCharacterModal = () => {
    if (!selectedCharacter) return;
    setCharacterModalMode("edit");
    setCharacterNameInput(selectedCharacter.name);
    setCharacterForm({
      name: selectedCharacter.name,
      role: selectedCharacter.role ?? "",
      gender: selectedCharacter.gender ?? "",
      emoji: selectedCharacter.emoji ?? "",
      description: selectedCharacter.description ?? "",
      profile_image_url: selectedCharacter.profile_image_url ?? "",
    });
    setIsCharacterModalOpen(true);
  };

  const handleCharacterAutocomplete = () => {
    const mock = MOCK_CHARACTER_AUTOCOMPLETE[characterNameInput];
    if (mock) setCharacterForm(mock);
  };

  const CHARACTER_REQUIRED: { key: keyof typeof characterForm; label: string }[] = [
    { key: "name", label: "이름" },
    { key: "role", label: "역할" },
    { key: "gender", label: "성별" },
    { key: "emoji", label: "이모지" },
    { key: "description", label: "소개" },
    { key: "profile_image_url", label: "프로필 이미지 URL" },
  ];

  const handleCharacterSave = async () => {
    if (!selectedBookId) return;

    const missing = CHARACTER_REQUIRED.filter((f) => !String(characterForm[f.key] ?? "").trim());
    if (missing.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "필수 항목 미입력",
        html: missing.map((f) => `<b>${f.label}</b>`).join(", ") + "을(를) 입력해주세요.",
        confirmButtonText: "확인",
        confirmButtonColor: "#c7a8ff",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (characterModalMode === "add") {
        const created = await adminCharactersApi.create({
          ...characterForm,
          book_id: selectedBookId,
        });
        setCharacters((prev) => [...prev, created]);
      } else if (selectedCharacterId != null) {
        const updated = await adminCharactersApi.update(selectedCharacterId, characterForm);
        setCharacters((prev) =>
          prev.map((c) => (c.id === selectedCharacterId ? updated : c))
        );
      }
      setIsCharacterModalOpen(false);
      await Swal.fire({
        icon: "success",
        title: "저장되었습니다",
        confirmButtonText: "확인",
        confirmButtonColor: "#c7a8ff",
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "저장 실패",
        text: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
        confirmButtonText: "확인",
        confirmButtonColor: "#c7a8ff",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openAddPersonaModal = () => {
    setPersonaModalMode("add");
    setPersonaLlmInput(selectedCharacter?.name ?? "");
    setPersonaForm(EMPTY_PERSONA_FORM);
    setIsPersonaModalOpen(true);
  };

  const openEditPersonaModal = () => {
    if (!selectedCharacterId) return;
    setPersonaModalMode("edit");
    setPersonaLlmInput(selectedCharacter?.name ?? "");
    setPersonaForm(getPersonaFormFromMock(selectedCharacterId));
    setIsPersonaModalOpen(true);
  };

  const handlePersonaAutocomplete = () => {
    if (!selectedCharacterId) return;
    setPersonaForm(getPersonaFormFromMock(selectedCharacterId));
  };

  const updatePersonaField = (field: keyof PersonaForm, value: string) => {
    setPersonaForm((prev) => ({ ...prev, [field]: value }));
  };

  const inputCls =
    "w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]";
  const textareaCls =
    "w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-none focus:border-[#c7a8ff]";
  const fieldWrapCls = "bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5";
  const labelCls = "block text-[10px] font-bold text-[#9b74ad] mb-1.5";

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">캐릭터 관리</h3>
          <p className="mt-1.5 text-[13px] text-[#94859d]">
            동화책을 선택한 후 캐릭터를 조회하고 페르소나를 관리합니다.
          </p>
        </div>
        {selectedBookId && (
          <button
            type="button"
            onClick={openAddCharacterModal}
            className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
          >
            + 캐릭터 추가
          </button>
        )}
      </div>

      {/* Book Selection */}
      <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)] mb-3.5">
        <h4 className="m-0 mb-3 text-[15px] text-[#72508c]">동화책 선택</h4>
        <select
          value={selectedBookId ?? ""}
          onChange={(e) => {
            setSelectedBookId(e.target.value ? Number(e.target.value) : null);
            setSelectedCharacterId(null);
          }}
          className="bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-3 py-2 outline-none focus:border-[#c7a8ff] w-full sm:w-80"
        >
          <option value="">동화책을 선택하세요</option>
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
        </select>
      </section>

      {/* Character List */}
      {selectedBookId && (
        <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)] mb-3.5">
          <h4 className="m-0 mb-3 text-[15px] text-[#72508c]">
            {selectedBook?.title} · 캐릭터 목록
          </h4>
          {characters.length === 0 ? (
            <p className="text-[12px] text-[#94859d] text-center py-6">
              이 동화책에 등록된 캐릭터가 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  emoji={character.emoji ?? "📖"}
                  name={character.name}
                  description={[character.role, character.gender].filter(Boolean).join(" · ")}
                  onClick={() =>
                    setSelectedCharacterId(
                      selectedCharacterId === character.id ? null : character.id
                    )
                  }
                  isSelected={selectedCharacterId === character.id}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Character Detail Panel */}
      {selectedCharacter && (
        <section className="bg-gradient-to-br from-[#fff7fb] to-[#f4efff] border border-[#eadcf0] rounded-3xl p-4">
          <div className="w-full max-w-3xl mx-auto bg-white border border-[#eadcf0] rounded-[28px] shadow-[0_24px_60px_rgba(130,90,160,0.22)] p-4">
            {/* Character Info */}
            <div className="flex items-start justify-between gap-3 border-b border-[#eadcf0] pb-3.5 mb-3.5">
              <div className="flex gap-3 items-center">
                <div className="h-[80px] w-[80px] rounded-3xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] grid place-items-center text-4xl shrink-0">
                  {selectedCharacter.emoji ?? "📖"}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h4 className="m-0 text-[18px] tracking-tight text-[#72508c]">
                      {selectedCharacter.name}
                    </h4>
                    {selectedCharacter.role && (
                      <span className="bg-[#f7ecfb] text-[#8d65a5] border border-[#eadcf0] rounded-full px-2 py-0.5 text-[10px] font-bold">
                        {selectedCharacter.role}
                      </span>
                    )}
                    {selectedCharacter.gender && (
                      <span className="bg-[#f0f0ff] text-[#6060c0] border border-[#dcdcf0] rounded-full px-2 py-0.5 text-[10px] font-bold">
                        {selectedCharacter.gender}
                      </span>
                    )}
                  </div>
                  <p className="m-0 text-[12px] text-[#94859d] leading-relaxed">
                    {selectedCharacter.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openEditCharacterModal}
                className="rounded-full px-4 py-2 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0] whitespace-nowrap shrink-0"
              >
                수정
              </button>
            </div>

            {/* Persona Info */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="m-0 text-[15px] text-[#72508c]">페르소나 정보</h4>
                <button
                  type="button"
                  onClick={selectedPersona ? openEditPersonaModal : openAddPersonaModal}
                  className="rounded-full px-4 py-2 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
                >
                  {selectedPersona ? "페르소나 수정" : "페르소나 추가"}
                </button>
              </div>

              {selectedPersona ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                    <b className="block text-[#72508c] text-[12px] mb-1">성격</b>
                    <p className="m-0 text-[#6f6174] text-[11px] leading-relaxed">
                      {selectedPersona.personality}
                    </p>
                  </div>
                  <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                    <b className="block text-[#72508c] text-[12px] mb-1">말투 · 말버릇</b>
                    <p className="m-0 text-[#6f6174] text-[11px] leading-relaxed">
                      {selectedPersona.speechStyle}
                      <br />
                      <span className="text-[#9b74ad]">
                        &ldquo;{selectedPersona.catchphrase}&rdquo;
                      </span>
                    </p>
                  </div>
                  <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                    <b className="block text-[#72508c] text-[12px] mb-1">인사말</b>
                    <p className="m-0 text-[#6f6174] text-[11px] leading-relaxed">
                      시작: {selectedPersona.greetingStart}
                      <br />
                      종료: {selectedPersona.greetingEnd}
                    </p>
                  </div>
                  <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                    <b className="block text-[#72508c] text-[12px] mb-1">배경</b>
                    <p className="m-0 text-[#6f6174] text-[11px] leading-relaxed">
                      {selectedPersona.historicalBackground} · {selectedPersona.backgroundDescription}
                    </p>
                  </div>
                  <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                    <b className="block text-[#72508c] text-[12px] mb-1">태그</b>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {selectedPersona.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-[#f7ecfb] text-[#8d65a5] border border-[#eadcf0] rounded-full px-2 py-0.5 text-[10px] font-bold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                    <b className="block text-[#72508c] text-[12px] mb-1">승인 상태</b>
                    <span
                      className={`inline-block border rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        APPROVAL_STYLE[selectedPersona.approvalStatus]
                      }`}
                    >
                      {APPROVAL_LABEL[selectedPersona.approvalStatus]}
                    </span>
                  </div>
                  <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5 sm:col-span-2">
                    <b className="block text-[#72508c] text-[12px] mb-1">시스템 프롬프트</b>
                    <p className="m-0 text-[#6f6174] text-[11px] leading-relaxed">
                      {selectedPersona.systemPrompt}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[13px] text-[#94859d]">
                  아직 등록된 페르소나가 없습니다.
                  <br />
                  <span className="text-[11px]">[페르소나 추가] 버튼을 눌러 등록하세요.</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Character Add/Edit Modal */}
      {isCharacterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#eadcf0] rounded-3xl shadow-[0_24px_60px_rgba(130,90,160,0.22)] p-4">
            <h3 className="text-lg tracking-tight text-[#7d5ba6] m-0 mb-1">
              {characterModalMode === "add" ? "캐릭터 추가" : `${characterForm.name} 수정`}
            </h3>
            <p className="mt-1 mb-3 text-[12px] text-[#94859d]">
              캐릭터명을 입력하고 AI 자동완성으로 정보를 채워보세요.
            </p>

            <div className={fieldWrapCls + " mb-3"}>
              <label className={labelCls}>캐릭터명으로 자동완성</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={characterNameInput}
                  onChange={(e) => setCharacterNameInput(e.target.value)}
                  placeholder="캐릭터 이름을 입력하세요"
                  className={inputCls + " flex-1"}
                />
                <button
                  type="button"
                  onClick={handleCharacterAutocomplete}
                  className="rounded-full px-4 py-1.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
                >
                  자동완성
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={fieldWrapCls}>
                <label className={labelCls}>이름 <span className="text-[#f0a0b0]">*</span></label>
                <input
                  type="text"
                  value={characterForm.name}
                  onChange={(e) => setCharacterForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="캐릭터 이름"
                  className={inputCls}
                />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>역할 <span className="text-[#f0a0b0]">*</span></label>
                <input
                  type="text"
                  value={characterForm.role ?? ""}
                  onChange={(e) => setCharacterForm((p) => ({ ...p, role: e.target.value }))}
                  placeholder="예: 주인공, 조력자, 악역"
                  className={inputCls}
                />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>성별 <span className="text-[#f0a0b0]">*</span></label>
                <input
                  type="text"
                  value={characterForm.gender ?? ""}
                  onChange={(e) => setCharacterForm((p) => ({ ...p, gender: e.target.value }))}
                  placeholder="예: 여성, 남성, 미상"
                  className={inputCls}
                />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>이모지 <span className="text-[#f0a0b0]">*</span></label>
                <input
                  type="text"
                  value={characterForm.emoji ?? ""}
                  onChange={(e) => setCharacterForm((p) => ({ ...p, emoji: e.target.value }))}
                  placeholder="예: 🧙"
                  className={inputCls}
                />
              </div>
              <div className={fieldWrapCls + " sm:col-span-2"}>
                <label className={labelCls}>프로필 이미지 URL <span className="text-[#f0a0b0]">*</span></label>
                <input
                  type="text"
                  value={characterForm.profile_image_url ?? ""}
                  onChange={(e) =>
                    setCharacterForm((p) => ({ ...p, profile_image_url: e.target.value }))
                  }
                  placeholder="프로필 이미지 URL"
                  className={inputCls}
                />
              </div>
              <div className={fieldWrapCls + " sm:col-span-2"}>
                <label className={labelCls}>소개 <span className="text-[#f0a0b0]">*</span></label>
                <textarea
                  value={characterForm.description ?? ""}
                  onChange={(e) =>
                    setCharacterForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="캐릭터 소개를 입력하세요"
                  rows={4}
                  className={textareaCls}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsCharacterModalOpen(false)}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCharacterSave}
                disabled={isSaving}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] disabled:opacity-50"
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persona Add/Edit Modal */}
      {isPersonaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-[#eadcf0] rounded-3xl shadow-[0_24px_60px_rgba(130,90,160,0.22)] p-4">
            <h3 className="text-lg tracking-tight text-[#7d5ba6] m-0 mb-1">
              {personaModalMode === "add"
                ? `${selectedCharacter?.name} 페르소나 추가`
                : `${selectedCharacter?.name} 페르소나 수정`}
            </h3>
            <p className="mt-1 mb-3 text-[12px] text-[#94859d]">
              캐릭터명 기반으로 AI 자동완성을 사용하거나 직접 입력하세요.
            </p>

            <div className={fieldWrapCls + " mb-3"}>
              <label className={labelCls}>캐릭터명으로 자동완성</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={personaLlmInput}
                  onChange={(e) => setPersonaLlmInput(e.target.value)}
                  placeholder="캐릭터 이름"
                  className={inputCls + " flex-1"}
                />
                <button
                  type="button"
                  onClick={handlePersonaAutocomplete}
                  className="rounded-full px-4 py-1.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
                >
                  자동완성
                </button>
              </div>
            </div>

            <p className="text-[11px] font-bold text-[#9b74ad] mb-2">기본 정보</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className={fieldWrapCls + " sm:col-span-2"}>
                <label className={labelCls}>성격</label>
                <textarea
                  value={personaForm.personality}
                  onChange={(e) => updatePersonaField("personality", e.target.value)}
                  rows={2}
                  placeholder="캐릭터의 성격을 입력하세요"
                  className={textareaCls}
                />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>말투</label>
                <input
                  type="text"
                  value={personaForm.speechStyle}
                  onChange={(e) => updatePersonaField("speechStyle", e.target.value)}
                  placeholder="예: 반말 · 차분함"
                  className={inputCls}
                />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>말버릇</label>
                <input
                  type="text"
                  value={personaForm.catchphrase}
                  onChange={(e) => updatePersonaField("catchphrase", e.target.value)}
                  placeholder="자주 쓰는 표현"
                  className={inputCls}
                />
              </div>
              <div className={fieldWrapCls + " sm:col-span-2"}>
                <label className={labelCls}>소개</label>
                <textarea
                  value={personaForm.introduction}
                  onChange={(e) => updatePersonaField("introduction", e.target.value)}
                  rows={2}
                  placeholder="캐릭터 소개"
                  className={textareaCls}
                />
              </div>
              <div className={fieldWrapCls + " sm:col-span-2"}>
                <label className={labelCls}>태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={personaForm.tags}
                  onChange={(e) => updatePersonaField("tags", e.target.value)}
                  placeholder="예: 질투심 많은, 자존심 강한"
                  className={inputCls}
                />
              </div>
            </div>

            <p className="text-[11px] font-bold text-[#9b74ad] mb-2">인사말</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className={fieldWrapCls}>
                <label className={labelCls}>시작 인사말</label>
                <textarea
                  value={personaForm.greetingStart}
                  onChange={(e) => updatePersonaField("greetingStart", e.target.value)}
                  rows={2}
                  placeholder="대화 시작 시 인사말"
                  className={textareaCls}
                />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>종료 인사말</label>
                <textarea
                  value={personaForm.greetingEnd}
                  onChange={(e) => updatePersonaField("greetingEnd", e.target.value)}
                  rows={2}
                  placeholder="대화 종료 시 인사말"
                  className={textareaCls}
                />
              </div>
            </div>

            <p className="text-[11px] font-bold text-[#9b74ad] mb-2">배경 정보</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className={fieldWrapCls + " sm:col-span-2"}>
                <label className={labelCls}>시작 상황</label>
                <textarea
                  value={personaForm.startingSituation}
                  onChange={(e) => updatePersonaField("startingSituation", e.target.value)}
                  rows={2}
                  placeholder="대화가 시작되는 상황 설명"
                  className={textareaCls}
                />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>시대 배경</label>
                <input
                  type="text"
                  value={personaForm.historicalBackground}
                  onChange={(e) => updatePersonaField("historicalBackground", e.target.value)}
                  placeholder="예: 동화 시대의 왕국"
                  className={inputCls}
                />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>배경 설명</label>
                <input
                  type="text"
                  value={personaForm.backgroundDescription}
                  onChange={(e) => updatePersonaField("backgroundDescription", e.target.value)}
                  placeholder="예: 거울의 방"
                  className={inputCls}
                />
              </div>
            </div>

            <p className="text-[11px] font-bold text-[#9b74ad] mb-2">유저 설정</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className={fieldWrapCls}>
                <label className={labelCls}>유저 역할</label>
                <input
                  type="text"
                  value={personaForm.userRole}
                  onChange={(e) => updatePersonaField("userRole", e.target.value)}
                  placeholder="예: 왕국의 백성"
                  className={inputCls}
                />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>유저 관계</label>
                <input
                  type="text"
                  value={personaForm.userRelationship}
                  onChange={(e) => updatePersonaField("userRelationship", e.target.value)}
                  placeholder="예: 질문을 던지는 존재"
                  className={inputCls}
                />
              </div>
            </div>

            <p className="text-[11px] font-bold text-[#9b74ad] mb-2">시스템 설정</p>
            <div className="grid grid-cols-1 gap-3">
              <div className={fieldWrapCls}>
                <label className={labelCls}>시스템 프롬프트</label>
                <textarea
                  value={personaForm.systemPrompt}
                  onChange={(e) => updatePersonaField("systemPrompt", e.target.value)}
                  rows={4}
                  placeholder="LLM에 전달할 시스템 프롬프트"
                  className={textareaCls}
                />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>승인 상태</label>
                <select
                  value={personaForm.approvalStatus}
                  onChange={(e) =>
                    updatePersonaField(
                      "approvalStatus",
                      e.target.value as PersonaForm["approvalStatus"]
                    )
                  }
                  className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
                >
                  <option value="draft">검토 중</option>
                  <option value="approved">승인됨</option>
                  <option value="rejected">반려됨</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsPersonaModalOpen(false)}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("페르소나 저장:", personaForm);
                  setIsPersonaModalOpen(false);
                }}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2]"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
