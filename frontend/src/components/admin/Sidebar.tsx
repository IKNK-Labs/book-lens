"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { href: "/admin", label: "📊 대시보드" },
  { href: "/admin/books", label: "📚 동화책 관리" },
  { href: "/admin/characters", label: "👥 캐릭터 관리" },
  { href: "/admin/test-chat", label: "💬 테스트 채팅" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 bg-gradient-to-b from-[#fff7fb] to-[#f2ecff] border-r border-[#eadcf0] p-4">
      <div className="bg-white border border-[#eadcf0] rounded-[22px] p-4 mb-4 shadow-[0_8px_20px_rgba(186,156,205,0.12)]">
        <b className="block text-[14px] text-[#7d5ba6]">관리자 모드</b>
        <span className="text-[11px] text-[#94859d]">서비스 운영 현황</span>
      </div>
      <nav className="grid gap-2">
        {MENU_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2.5 text-[12px] transition-colors ${
                isActive
                  ? "bg-gradient-to-br from-[#ffd6ea] to-[#d9c7ff] text-[#6b4b82] font-bold"
                  : "bg-white border border-[#eadcf0] text-[#78647f]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
