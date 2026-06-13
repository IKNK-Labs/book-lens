"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fff7fb] via-[#f4efff] to-[#fff5e8]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#fff7fb] via-[#f4efff] to-[#fff5e8] text-[#594764]">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
