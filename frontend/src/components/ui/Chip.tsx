import type { ButtonHTMLAttributes, ReactNode } from "react";

type ChipProps = {
  children: ReactNode;
  active?: boolean;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Chip({
  children,
  active = false,
  className = "",
  ...buttonProps
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-extrabold sm:text-sm ${
        active
          ? "border-transparent bg-gradient-to-r from-[var(--pink)] to-[var(--violet)] text-white"
          : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--accent-strong)]"
      } ${className}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
