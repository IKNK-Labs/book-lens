import { Card } from "../ui/Card";

export function PreferencePreview() {
  return (
    <Card className="bg-[var(--surface-soft)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">Preview</p>
          <h2 className="mt-2 text-lg font-black tracking-[-0.04em] text-[var(--accent-strong)]">설정 적용 미리보기</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">실제 채팅방이 아니라, 설정값이 응답에 반영되는 느낌을 보여주는 mock 영역입니다.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        <div className="justify-self-end rounded-3xl bg-gradient-to-br from-[var(--violet)] to-[var(--pink)] px-4 py-3 text-sm text-white">
          왜 백설공주를 미워했어?
        </div>
        <div className="justify-self-start rounded-3xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
          거울의 말 때문에 내 마음이 많이 속상했어. 그래서 질투가 커졌지. 하지만 누군가를 아프게 하려 한 건 잘못된 선택이었어.
        </div>
      </div>
    </Card>
  );
}
