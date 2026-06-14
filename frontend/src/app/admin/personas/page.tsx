import Link from "next/link";

const PERSONAS = [
  {
    name: "구름이",
    book: "달빛 숲의 약속",
    status: "검토 대기",
    tone: "다정하고 짧은 문장",
    tags: ["초등 저학년", "상냥함", "모험"],
  },
  {
    name: "토토",
    book: "비밀 우산 가게",
    status: "초안",
    tone: "호기심 많은 질문형",
    tags: ["유머", "친구", "안전"],
  },
];

export default function Page() {
  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">
            페르소나 관리
          </h3>
          <p className="mt-1.5 text-[13px] text-[#94859d]">
            캐릭터의 말투, 성격, 금지어 규칙을 등록하고 검토합니다.
          </p>
        </div>
        <Link
          href="/admin/personas/new"
          className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
        >
          + 페르소나 등록
        </Link>
      </div>

      <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)]">
        <div className="flex justify-between items-center gap-3 mb-3">
          <h4 className="m-0 text-[15px] text-[#72508c]">
            등록된 페르소나 목록
          </h4>
          <span className="text-[11px] text-[#94859d]">
            샘플 데이터 미리보기
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {PERSONAS.map((persona) => (
            <Link
              key={persona.name}
              href="/admin/personas/preview"
              className="block bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-3 hover:border-[#d9c7ff] transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] grid place-items-center text-xl">
                    🎭
                  </div>
                  <div>
                    <b className="block text-[13px] text-[#65506e]">
                      {persona.name}
                    </b>
                    <span className="block mt-1 text-[10px] text-[#94859d]">
                      {persona.book}
                    </span>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1.5 text-[10px] font-bold text-[#8b67a2] bg-[#f3eaff]">
                  {persona.status}
                </span>
              </div>

              <p className="m-0 text-[12px] leading-relaxed text-[#6f6174]">
                {persona.tone}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {persona.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold text-[#8d65a5] bg-[#f7ecfb] border border-[#eadcf0]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
