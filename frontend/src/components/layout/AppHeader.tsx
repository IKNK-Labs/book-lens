import Link from "next/link";

const navItems = [
  { href: "/books", label: "동화" },
  { href: "/chat/witch", label: "채팅" },
  { href: "/settings", label: "설정" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--surface)]/86 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="Book Lens 홈">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[var(--pink)] to-[var(--violet)] text-lg font-black text-white shadow-sm">
            B
          </span>
          <span>
            <span className="block text-sm font-black tracking-[-0.04em] text-[var(--accent-strong)] sm:text-base">
              Book Lens
            </span>
            <span className="hidden text-xs text-[var(--muted)] sm:block">동화 속 캐릭터와 대화하기</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] p-1 text-sm text-[var(--muted)]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 font-bold transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
