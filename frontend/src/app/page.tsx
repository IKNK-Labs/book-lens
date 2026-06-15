import Link from "next/link";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";

const entries = [
  {
    href: "/books",
    emoji: "📚",
    title: "도서 검색",
    description: "대화할 동화를 고르고 캐릭터 채팅으로 이어지는 화면입니다.",
  },
  {
    href: "/chat/witch",
    emoji: "💬",
    title: "캐릭터 채팅",
    description: "동화 속 캐릭터의 페르소나를 유지하는 채팅 UI shell입니다.",
  },
  {
    href: "/settings",
    emoji: "⚙️",
    title: "사용자 맞춤 설정",
    description: "연령대, 난이도, 응답 길이, 설명 방식을 조절하는 폼 화면입니다.",
  },
];

export default function Page() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <section className="rounded-[36px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)] sm:p-10">
          <SectionHeader
            eyebrow="AI fairy talk"
            title="동화 속 캐릭터와 대화하는 Book Lens"
            description="현재 화면은 API 연결 전 프론트엔드 shell입니다. 도서 검색, 캐릭터 채팅, 사용자 맞춤 설정의 흐름을 mock 데이터로 확인할 수 있습니다."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {entries.map((entry) => (
              <Link key={entry.href} href={entry.href}>
                <Card className="h-full transition hover:-translate-y-0.5">
                  <div className="text-4xl">{entry.emoji}</div>
                  <h2 className="mt-4 text-xl font-black tracking-[-0.05em] text-[var(--accent-strong)]">{entry.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{entry.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
