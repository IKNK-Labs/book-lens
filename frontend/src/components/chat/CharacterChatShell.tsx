import { Card } from "../ui/Card";

export function CharacterChatShell({ characterId }: { characterId: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="grid gap-4 self-start">
        <Card>
          <div className="grid place-items-center rounded-[26px] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--accent-soft)] to-[var(--surface-muted)] p-8 text-7xl">
            💬
          </div>
          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">준비 중</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[var(--accent-strong)]">
              캐릭터 대화
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              이 캐릭터의 대화 정보를 아직 불러올 수 없습니다.
            </p>
            <p className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-xs leading-5 text-[var(--muted)]">
              요청한 캐릭터 ID: {characterId}
            </p>
          </div>
        </Card>
      </aside>

      <section className="overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4">
          <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--foreground)]">
            캐릭터 대화 기능은 준비 중입니다.
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            동화 상세 화면에서 캐릭터 연결이 준비되면 이곳에서 대화를 이어갈 수 있습니다.
          </p>
        </div>
        <div className="grid min-h-[440px] place-items-center p-5">
          <div className="max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--surface-soft)] p-6 text-center">
            <p className="text-5xl">🛠️</p>
            <h3 className="mt-4 text-xl font-black text-[var(--accent-strong)]">
              대화 연결 준비 중
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              실제 캐릭터 정보, 대화 세션, 메시지 조회 API가 연결되기 전까지는 대화 내역을 표시하지 않습니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
