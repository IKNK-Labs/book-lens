"use client";

import Link from "next/link";
import { useState } from "react";
import BookCard from "@/components/admin/BookCard";

const SAMPLE_BOOK = {
  id: 1,
  title: "백설공주",
  author: "그림 형제",
  publisher: "삼성출판사",
  description: "왕비의 질투를 피해 숲속으로 도망간 백설공주의 이야기",
};

const MOCK_AUTOCOMPLETE = {
  title: "백설공주",
  author: "그림 형제",
  publisher: "삼성출판사",
  description: "왕비의 질투를 피해 숲속으로 도망간 백설공주의 이야기",
};

const MOCK_CHARACTER_AUTOCOMPLETE = {
  name: "백설공주",
  role: "주인공",
  gender: "여성",
  emoji: "👸",
  description: "왕비의 질투를 피해 숲속으로 도망친 마음씨 착한 공주",
  profileImageUrl: "",
};

type BookForm = {
  title: string;
  author: string;
  publisher: string;
  description: string;
};

// character 테이블 컬럼(name, role, gender, emoji, description, profile_image_url)에 맞춘 폼
type CharacterForm = {
  name: string;
  role: string;
  gender: string;
  emoji: string;
  description: string;
  profileImageUrl: string;
};

const EMPTY_CHARACTER_FORM: CharacterForm = {
  name: "",
  role: "",
  gender: "",
  emoji: "",
  description: "",
  profileImageUrl: "",
};

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"llm" | "isbn">("llm");
  const [autocompleteTitle, setAutocompleteTitle] = useState("");
  const [form, setForm] = useState<BookForm>({
    title: SAMPLE_BOOK.title,
    author: SAMPLE_BOOK.author,
    publisher: SAMPLE_BOOK.publisher,
    description: SAMPLE_BOOK.description,
  });

  const openModal = () => {
    setForm({
      title: SAMPLE_BOOK.title,
      author: SAMPLE_BOOK.author,
      publisher: SAMPLE_BOOK.publisher,
      description: SAMPLE_BOOK.description,
    });
    setActiveTab("llm");
    setAutocompleteTitle("");
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleAutocomplete = () => {
    setForm({
      title: MOCK_AUTOCOMPLETE.title,
      author: MOCK_AUTOCOMPLETE.author,
      publisher: MOCK_AUTOCOMPLETE.publisher,
      description: MOCK_AUTOCOMPLETE.description,
    });
  };

  const updateField = (field: keyof BookForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [characterNameInput, setCharacterNameInput] = useState("");
  const [characterForm, setCharacterForm] =
    useState<CharacterForm>(EMPTY_CHARACTER_FORM);

  const openCharacterModal = () => {
    setCharacterNameInput("");
    setCharacterForm(EMPTY_CHARACTER_FORM);
    setIsCharacterModalOpen(true);
  };

  const closeCharacterModal = () => setIsCharacterModalOpen(false);

  const handleCharacterAutocomplete = () => {
    setCharacterForm({
      name: MOCK_CHARACTER_AUTOCOMPLETE.name,
      role: MOCK_CHARACTER_AUTOCOMPLETE.role,
      gender: MOCK_CHARACTER_AUTOCOMPLETE.gender,
      emoji: MOCK_CHARACTER_AUTOCOMPLETE.emoji,
      description: MOCK_CHARACTER_AUTOCOMPLETE.description,
      profileImageUrl: MOCK_CHARACTER_AUTOCOMPLETE.profileImageUrl,
    });
  };

  const updateCharacterField = (field: keyof CharacterForm, value: string) => {
    setCharacterForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">
            동화책 관리
          </h3>
          <p className="mt-1.5 text-[13px] text-[#94859d]">
            등록된 동화책 목록을 확인하고 새 동화책을 추가합니다.
          </p>
        </div>
        <Link
          href="/admin/books/new"
          className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
        >
          + 책 등록
        </Link>
      </div>

      <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)]">
        <h4 className="m-0 mb-3 text-[15px] text-[#72508c]">
          등록된 동화책 목록
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <BookCard
            title={SAMPLE_BOOK.title}
            description={SAMPLE_BOOK.description}
            onEdit={openModal}
            onAddCharacter={openCharacterModal}
          />
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#eadcf0] rounded-3xl shadow-[0_24px_60px_rgba(130,90,160,0.22)] p-4">
            <h3 className="text-lg tracking-tight text-[#7d5ba6] m-0 mb-1">
              동화책 정보 수정
            </h3>
            <p className="mt-1 mb-3 text-[12px] text-[#94859d]">
              AI 자동완성 또는 ISBN 스캔으로 정보를 채워보세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("llm")}
                className={`flex-1 rounded-2xl border border-dashed px-4 py-3 text-left text-[12px] text-[#6f6174] transition-colors ${
                  activeTab === "llm"
                    ? "border-[#c7a8ff] bg-[#fff0f7]"
                    : "border-[#eadcf0] bg-white"
                }`}
              >
                <b className="block text-[#7d5ba6] mb-1">🌟 LLM 자동완성</b>
                제목을 기반으로 저자, 출판사, 줄거리를 AI가 채워줍니다.
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("isbn")}
                className={`flex-1 rounded-2xl border border-dashed px-4 py-3 text-left text-[12px] text-[#6f6174] transition-colors ${
                  activeTab === "isbn"
                    ? "border-[#c7a8ff] bg-[#fff0f7]"
                    : "border-[#eadcf0] bg-white"
                }`}
              >
                <b className="block text-[#7d5ba6] mb-1">📷 ISBN 스캔</b>
                ISBN 바코드를 스캔해서 도서 정보를 불러옵니다.
              </button>
            </div>

            {activeTab === "llm" ? (
              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5 mb-3">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  제목으로 자동완성
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={autocompleteTitle}
                    onChange={(e) => setAutocompleteTitle(e.target.value)}
                    placeholder="동화책 제목을 입력하세요"
                    className="flex-1 min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
                  />
                  <button
                    type="button"
                    onClick={handleAutocomplete}
                    className="rounded-full px-4 py-1.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
                  >
                    자동완성
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#fff9fc] border border-dashed border-[#eadcf0] rounded-2xl p-4 mb-3 text-center text-[12px] text-[#94859d]">
                ISBN 스캔 기능은 준비 중입니다.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  제목
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="동화책 제목을 입력하세요"
                  className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
                />
              </div>

              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  저자
                </label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => updateField("author", e.target.value)}
                  placeholder="저자명을 입력하세요"
                  className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
                />
              </div>

              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  출판사
                </label>
                <input
                  type="text"
                  value={form.publisher}
                  onChange={(e) => updateField("publisher", e.target.value)}
                  placeholder="출판사명을 입력하세요"
                  className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
                />
              </div>

              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5 sm:col-span-2">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  줄거리
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="동화책의 줄거리를 입력하세요"
                  rows={4}
                  className="w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-none focus:border-[#c7a8ff]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0] whitespace-nowrap"
              >
                취소
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {isCharacterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#eadcf0] rounded-3xl shadow-[0_24px_60px_rgba(130,90,160,0.22)] p-4">
            <h3 className="text-lg tracking-tight text-[#7d5ba6] m-0 mb-1">
              {SAMPLE_BOOK.title} 캐릭터 추가
            </h3>
            <p className="mt-1 mb-3 text-[12px] text-[#94859d]">
              캐릭터명을 입력하고 AI 자동완성으로 정보를 채워보세요.
            </p>

            <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5 mb-3">
              <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                캐릭터명으로 자동완성
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={characterNameInput}
                  onChange={(e) => setCharacterNameInput(e.target.value)}
                  placeholder="캐릭터 이름을 입력하세요"
                  className="flex-1 min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
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
              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  이름
                </label>
                <input
                  type="text"
                  value={characterForm.name}
                  onChange={(e) => updateCharacterField("name", e.target.value)}
                  placeholder="캐릭터 이름을 입력하세요"
                  className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
                />
              </div>

              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  역할
                </label>
                <input
                  type="text"
                  value={characterForm.role}
                  onChange={(e) => updateCharacterField("role", e.target.value)}
                  placeholder="예: 주인공, 조력자"
                  className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
                />
              </div>

              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  성별
                </label>
                <input
                  type="text"
                  value={characterForm.gender}
                  onChange={(e) => updateCharacterField("gender", e.target.value)}
                  placeholder="예: 여성, 남성"
                  className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
                />
              </div>

              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  이모지
                </label>
                <input
                  type="text"
                  value={characterForm.emoji}
                  onChange={(e) => updateCharacterField("emoji", e.target.value)}
                  placeholder="예: 👸"
                  className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
                />
              </div>

              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5 sm:col-span-2">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  프로필 이미지 URL
                </label>
                <input
                  type="text"
                  value={characterForm.profileImageUrl}
                  onChange={(e) =>
                    updateCharacterField("profileImageUrl", e.target.value)
                  }
                  placeholder="프로필 이미지 URL을 입력하세요"
                  className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
                />
              </div>

              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5 sm:col-span-2">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  소개
                </label>
                <textarea
                  value={characterForm.description}
                  onChange={(e) =>
                    updateCharacterField("description", e.target.value)
                  }
                  placeholder="캐릭터 소개를 입력하세요"
                  rows={4}
                  className="w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-none focus:border-[#c7a8ff]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={closeCharacterModal}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0] whitespace-nowrap"
              >
                취소
              </button>
              <button
                type="button"
                onClick={closeCharacterModal}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
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
