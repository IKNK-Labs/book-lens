"use client";

import { useState } from "react";
import CharacterCard from "@/components/admin/CharacterCard";

// character 테이블 컬럼(name, role, gender, emoji, description, profile_image_url)에 맞춘 폼
type CharacterForm = {
  name: string;
  role: string;
  gender: string;
  emoji: string;
  description: string;
  profileImageUrl: string;
};

const CURRENT_CHARACTER: CharacterForm = {
  name: "마녀",
  role: "악역",
  gender: "여성",
  emoji: "🧙",
  description:
    "백설공주와 일곱 난쟁이 속 마녀. 거울의 말에 상처받고 질투심을 느끼지만, 답변에서는 폭력적 행동을 미화하지 않도록 설정합니다.",
  profileImageUrl: "",
};

const CHARACTERS = [
  {
    emoji: "🧙",
    name: "마녀",
    description: "백설공주 · 질투심 많은 · 반말/차분함",
  },
  {
    emoji: "👸",
    name: "신데렐라",
    description: "신데렐라 · 상냥한 · 존댓말/따뜻함",
  },
  {
    emoji: "🐺",
    name: "늑대",
    description: "빨간 모자 · 교활한 · 장난스러움",
  },
  {
    emoji: "🦊",
    name: "여우",
    description: "어린왕자 · 철학적 · 차분함",
  },
];

export default function Page() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [characterForm, setCharacterForm] = useState<CharacterForm>(
    CURRENT_CHARACTER
  );

  const openEditModal = () => {
    setCharacterForm(CURRENT_CHARACTER);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => setIsEditModalOpen(false);

  const updateCharacterField = (field: keyof CharacterForm, value: string) => {
    setCharacterForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log("수정된 캐릭터 데이터:", characterForm);
    setIsEditModalOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">
            캐릭터 페르소나 목록
          </h3>
          <p className="mt-1.5 text-[13px] text-[#94859d]">
            카드 클릭 시 상세에서 이미지, 줄거리, 성격, 설명, 말투, 말버릇,
            금지 규칙을 확인하고 수정합니다.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0] whitespace-nowrap"
          >
            필터
          </button>
          <button
            type="button"
            className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
          >
            + 페르소나 추가
          </button>
        </div>
      </div>

      <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)] mb-3.5">
        <h4 className="m-0 mb-3 text-[15px] text-[#72508c]">
          캐릭터 카드 목록
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {CHARACTERS.map((character) => (
            <CharacterCard key={character.name} {...character} />
          ))}
        </div>
      </section>

      <section className="relative min-h-[560px] bg-gradient-to-br from-[#fff7fb] to-[#f4efff] border border-[#eadcf0] rounded-3xl overflow-hidden p-4">
        <div className="w-full max-w-3xl mx-auto bg-white border border-[#eadcf0] rounded-[28px] shadow-[0_24px_60px_rgba(130,90,160,0.22)] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3.5 border-b border-[#eadcf0] pb-3.5 mb-3.5">
            <div className="h-[132px] rounded-3xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] grid place-items-center text-5xl">
              🧙
            </div>
            <div>
              <h4 className="m-0 text-[22px] tracking-tight text-[#72508c]">
                마녀 페르소나 상세
              </h4>
              <p className="mt-1.5 mb-2.5 text-[12px] text-[#94859d] leading-relaxed">
                백설공주와 일곱 난쟁이 속 마녀. 거울의 말에 상처받고 질투심을
                느끼지만, 답변에서는 폭력적 행동을 미화하지 않도록 설정합니다.
              </p>
              <div className="flex gap-1.5 flex-wrap">
                <span className="bg-[#f7ecfb] text-[#8d65a5] border border-[#eadcf0] rounded-full px-2.5 py-1.5 text-[10px] font-extrabold">
                  질투심 많은
                </span>
                <span className="bg-[#f7ecfb] text-[#8d65a5] border border-[#eadcf0] rounded-full px-2.5 py-1.5 text-[10px] font-extrabold">
                  자존심 강한
                </span>
                <span className="bg-[#f7ecfb] text-[#8d65a5] border border-[#eadcf0] rounded-full px-2.5 py-1.5 text-[10px] font-extrabold">
                  상처받은
                </span>
                <span className="bg-[#fff1f1] text-[#c06a78] border border-[#ffd4dc] rounded-full px-2.5 py-1.5 text-[10px] font-extrabold">
                  폭력 미화 금지
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
              <b className="block text-[#72508c] text-[12px] mb-1.5">
                동화 줄거리 요약
              </b>
              <p className="m-0 text-[#6f6174] text-[11px] leading-relaxed">
                백설공주가 왕비의 질투를 피해 숲속으로 도망가고, 일곱 난쟁이와
                함께 지내다가 독사과 사건을 겪는 이야기.
              </p>
            </div>
            <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
              <b className="block text-[#72508c] text-[12px] mb-1.5">
                등장인물 관계
              </b>
              <p className="m-0 text-[#6f6174] text-[11px] leading-relaxed">
                백설공주: 질투 대상 · 거울: 감정 자극 요소 · 난쟁이:
                백설공주의 보호자
              </p>
            </div>
            <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
              <b className="block text-[#72508c] text-[12px] mb-1.5">
                성격 및 설명
              </b>
              <p className="m-0 text-[#6f6174] text-[11px] leading-relaxed">
                자존심이 강하고 인정받고 싶어함. 아름다움에 집착하지만 내면에는
                불안감이 있음.
              </p>
            </div>
            <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
              <b className="block text-[#72508c] text-[12px] mb-1.5">
                말투/말버릇
              </b>
              <p className="m-0 text-[#6f6174] text-[11px] leading-relaxed">
                반말 · 차분하지만 날카로움 · &ldquo;거울아, 거울아. 이 마음도
                비춰줄 수 있겠니?&rdquo;
              </p>
            </div>
            <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
              <b className="block text-[#72508c] text-[12px] mb-1.5">
                시스템 프롬프트
              </b>
              <p className="m-0 text-[#6f6174] text-[11px] leading-relaxed">
                마녀 캐릭터로 답변하되 아이 친화적 표현을 사용하고, 해로운
                행동은 반성적으로 표현한다.
              </p>
            </div>
            <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
              <b className="block text-[#72508c] text-[12px] mb-1.5">
                수정 가능 항목
              </b>
              <p className="m-0 text-[#6f6174] text-[11px] leading-relaxed">
                이미지, 캐릭터 설명, 성격 키워드, 말투, 말버릇, 금지 규칙,
                테스트 질문 샘플
              </p>
            </div>
          </div>

          <div className="mt-2.5 bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
            <b className="text-[#72508c] text-[12px]">테스트 채팅</b>
            <div className="mt-2 grid gap-2">
              <div className="rounded-2xl px-3 py-2.5 text-[11px] leading-relaxed text-white bg-gradient-to-br from-[#c7a6ff] to-[#f2a7d7] ml-9">
                너는 왜 백설공주를 해치려 했어?
              </div>
              <div className="rounded-2xl px-3 py-2.5 text-[11px] leading-relaxed bg-gradient-to-br from-[#fff0f7] to-[#f7e9ff] border border-[#f0d9ff] text-[#6d5f72] mr-5">
                거울의 말이 내 마음을 깊이 찔렀어. 하지만 누군가를 아프게 하는
                건 옳지 않았다는 걸 이제는 알아.
              </div>
            </div>
            <div className="flex gap-2 flex-wrap mt-2.5">
              <button
                type="button"
                onClick={openEditModal}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0]"
              >
                수정
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0]"
              >
                다시 테스트
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2]"
              >
                배포 승인
              </button>
            </div>
          </div>
        </div>
      </section>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#eadcf0] rounded-3xl shadow-[0_24px_60px_rgba(130,90,160,0.22)] p-4">
            <h3 className="text-lg tracking-tight text-[#7d5ba6] m-0 mb-1">
              {CURRENT_CHARACTER.name} 수정
            </h3>
            <p className="mt-1 mb-3 text-[12px] text-[#94859d]">
              캐릭터 정보를 수정하고 저장하세요.
            </p>

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
                  placeholder="예: 🧙"
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
                onClick={closeEditModal}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0] whitespace-nowrap"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
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
