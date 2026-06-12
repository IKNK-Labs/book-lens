"use client";

import Link from "next/link";
import { useState } from "react";

export default function Page() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [synopsis, setSynopsis] = useState("");

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">
            동화책 등록
          </h3>
          <p className="mt-1.5 text-[13px] text-[#94859d]">
            동화책 정보를 입력하고 저장하세요. AI 자동완성과 ISBN 스캔으로
            입력을 도울 수 있습니다.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/books"
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
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-dashed border-[#d9c7ff] bg-[#fff0f7] px-4 py-3 text-left text-[12px] text-[#6f6174]"
          >
            <b className="block text-[#7d5ba6] mb-1">✨ LLM 자동완성</b>
            제목을 기반으로 저자, 출판사, 줄거리를 AI가 채워줍니다.
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl border border-dashed border-[#d9c7ff] bg-[#fff0f7] px-4 py-3 text-left text-[12px] text-[#6f6174]"
          >
            <b className="block text-[#7d5ba6] mb-1">📷 ISBN 스캔</b>
            ISBN 바코드를 스캔해서 도서 정보를 불러옵니다.
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5">
            <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
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
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="출판사명을 입력하세요"
              className="w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]"
            />
          </div>

          <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5 sm:col-span-2">
            <label className="block text-[10px] font-bold text-[#9b74ad] mb-1.5">
              줄거리
            </label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="동화책의 줄거리를 입력하세요"
              rows={5}
              className="w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-none focus:border-[#c7a8ff]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
