const METRICS = [
  { label: "오늘 대화", value: "128", helper: "전일 대비 +14%" },
  { label: "인기 캐릭터", value: "구름이", helper: "42회 대화" },
  { label: "등록 도서", value: "0", helper: "도서 등록 대기" },
];

const CHARACTER_RANKING = [
  { rank: "1", name: "구름이", book: "달빛 숲의 약속", count: "42회" },
  { rank: "2", name: "토토", book: "비밀 우산 가게", count: "31회" },
  { rank: "3", name: "루나", book: "별을 줍는 아이", count: "24회" },
];

const RECENT_TASKS = [
  "도서 등록 후 캐릭터 정보를 연결하세요.",
  "캐릭터 말투와 금지어 규칙을 검토하세요.",
  "페르소나 승인 상태를 확인하세요.",
];

export default function Page() {
  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">
            관리자 대시보드
          </h3>
          <p className="mt-1.5 text-[13px] text-[#94859d]">
            서비스 운영 현황과 등록 작업 흐름을 한 화면에서 확인합니다.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0] whitespace-nowrap">
            오늘 기준
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {METRICS.map((metric) => (
          <section
            key={metric.label}
            className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)]"
          >
            <span className="block text-[11px] font-bold text-[#9b74ad]">
              {metric.label}
            </span>
            <b className="block mt-2 text-3xl tracking-tight text-[#7d5ba6]">
              {metric.value}
            </b>
            <span className="block mt-1 text-[11px] text-[#94859d]">
              {metric.helper}
            </span>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)]">
          <div className="flex justify-between items-center gap-3 mb-3">
            <h4 className="m-0 text-[15px] text-[#72508c]">
              인기 캐릭터 랭킹
            </h4>
            <span className="text-[11px] text-[#94859d]">대화량 기준</span>
          </div>

          <div className="grid gap-2">
            {CHARACTER_RANKING.map((item) => (
              <div
                key={item.rank}
                className="grid grid-cols-[42px_1fr_auto] gap-3 items-center bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-3"
              >
                <div className="w-[42px] h-[42px] rounded-2xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] grid place-items-center text-[13px] font-black text-[#7d5ba6]">
                  {item.rank}
                </div>
                <div>
                  <b className="block text-[12px] text-[#65506e]">
                    {item.name}
                  </b>
                  <span className="block mt-1 text-[10px] text-[#94859d]">
                    {item.book}
                  </span>
                </div>
                <span className="rounded-full px-3 py-1.5 text-[10px] font-bold text-[#8b67a2] bg-[#f3eaff]">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)]">
          <h4 className="m-0 mb-3 text-[15px] text-[#72508c]">
            운영 체크리스트
          </h4>
          <div className="grid gap-2">
            {RECENT_TASKS.map((task, index) => (
              <div
                key={task}
                className="bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-3 text-[12px] text-[#6f6174]"
              >
                <b className="mr-2 text-[#9b74ad]">0{index + 1}</b>
                {task}
              </div>
            ))}
          </div>

          <div className="mt-4 bg-gradient-to-br from-[#fff0f7] to-[#f4efff] border border-[#eadcf0] rounded-2xl p-3">
            <b className="block text-[12px] text-[#7d5ba6] mb-1">
              다음 작업
            </b>
            <p className="m-0 text-[11px] leading-relaxed text-[#94859d]">
              도서 등록, 캐릭터 등록, 페르소나 설정 순서로 화면을 완성하면
              관리자 플로우가 자연스럽게 이어집니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
