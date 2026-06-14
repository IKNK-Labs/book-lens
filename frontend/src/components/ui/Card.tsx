import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] ${className}`}
    >
      {children}
    </section>
  );
}
