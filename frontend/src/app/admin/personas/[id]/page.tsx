import Link from "next/link";

export default function Page() {
  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">
            페르소나 상세
          </h3>
          <p className="mt-1.5 text-[13px] text-[#94859d]">
            등록된 캐릭터 페르소나의 말투와 안전 규칙을 검토합니다.
          </p>
        </div>
        <Link
          href="/admin/personas"
          className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0] whitespace-nowrap"
        >
          목록으로
        </Link>
      </div>

      <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)]">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
          <aside className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-4">
            <div className="h-36 rounded-2xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] grid place-items-center text-4xl mb-3">
              🎭
            </div>
            <b className="block text-[16px] text-[#65506e]">구름이</b>
            <span className="block mt-1 text-[11px] text-[#94859d]">
              달빛 숲의 약속
            </span>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["검토 대기", "상냥함", "모험"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold text-[#8d65a5] bg-[#f7ecfb] border border-[#eadcf0]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </aside>

          <div className="grid gap-3">
            {[
              ["성격", "다정하고 호기심이 많으며, 겁이 나도 친구를 위해 한 걸음 나아가는 캐릭터입니다."],
              ["말투", "짧고 부드러운 문장으로 대답하며, 사용자의 감정을 먼저 받아줍니다."],
              ["첫 인사", "안녕, 나는 구름이야. 오늘은 숲에서 어떤 장면이 궁금해?"],
              ["금지어 규칙", "폭력적 표현, 과도한 공포 표현, 책 내용과 맞지 않는 단정적 답변을 피합니다."],
            ].map(([label, content]) => (
              <div
                key={label}
                className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-3"
              >
                <b className="block text-[11px] text-[#9b74ad] mb-1.5">
                  {label}
                </b>
                <p className="m-0 text-[12px] leading-relaxed text-[#6f6174]">
                  {content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
