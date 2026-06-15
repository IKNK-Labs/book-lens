"use client";

import Link from "next/link";
import { useState } from "react";

export default function Page() {
  const [characterName, setCharacterName] = useState("");
  const [personality, setPersonality] = useState("");
  const [speechStyle, setSpeechStyle] = useState("");
  const [greeting, setGreeting] = useState("");

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">
            페르소나 등록
          </h3>
          <p className="mt-1.5 text-[13px] text-[#94859d]">
            캐릭터의 성격, 말투, 첫 인사와 대화 규칙을 설정합니다.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/personas"
            className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0] whitespace-nowrap"
          >
            취소
          </Link>
          <button
            type="button"
            className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
          >
            저장
          </button>
        </div>
      </div>

      <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)]">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          <div className="grid gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  연결 도서
                </label>
                <select className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]">
                  <option>달빛 숲의 약속</option>
                  <option>비밀 우산 가게</option>
                  <option>별을 줍는 아이</option>
                </select>
              </div>

              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  캐릭터 이름
                </label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="캐릭터 이름을 입력하세요"
                  className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
                />
              </div>
            </div>

            <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
              <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                성격
              </label>
              <textarea
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="상냥함, 호기심, 겁이 많지만 용기를 내는 모습 등을 입력하세요"
                rows={4}
                className="w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-none focus:border-[#c7a8ff]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  말투
                </label>
                <textarea
                  value={speechStyle}
                  onChange={(e) => setSpeechStyle(e.target.value)}
                  placeholder="짧고 다정하게, 질문을 자주 던지는 말투"
                  rows={4}
                  className="w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-none focus:border-[#c7a8ff]"
                />
              </div>

              <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
                <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                  첫 인사
                </label>
                <textarea
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="안녕, 나는 구름이야. 오늘은 어떤 장면이 궁금해?"
                  rows={4}
                  className="w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-none focus:border-[#c7a8ff]"
                />
              </div>
            </div>

            <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
              <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
                금지어 및 응답 규칙
              </label>
              <textarea
                placeholder="무서운 표현, 폭력적 표현, 책 내용과 맞지 않는 답변을 피하도록 규칙을 입력하세요"
                rows={3}
                className="w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-none focus:border-[#c7a8ff]"
              />
            </div>
          </div>

          <aside className="bg-gradient-to-br from-[#fff0f7] to-[#f4efff] border border-[#eadcf0] rounded-2xl p-4 h-fit">
            <h4 className="m-0 mb-3 text-[15px] text-[#72508c]">
              대화 미리보기
            </h4>
            <div className="grid gap-2">
              <div className="bg-white border border-[#eadcf0] rounded-2xl p-3 text-[11px] leading-relaxed text-[#6f6174]">
                사용자: 오늘 숲에서 무슨 일이 있었어?
              </div>
              <div className="bg-gradient-to-br from-[#fff0f7] to-[#f7e9ff] border border-[#f0d9ff] rounded-2xl p-3 text-[11px] leading-relaxed text-[#6d5f72]">
                <b className="block text-[#7d5ba6] mb-1">
                  {characterName || "캐릭터"}
                </b>
                {greeting ||
                  speechStyle ||
                  personality ||
                  "첫 인사와 말투를 입력하면 캐릭터 응답 톤을 여기서 확인할 수 있습니다."}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["초등 저학년", "짧은 답변", "책 기반"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold text-[#8d65a5] bg-white border border-[#eadcf0]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
