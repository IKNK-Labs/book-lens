export function Chip({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-extrabold sm:text-sm ${
        active
          ? "border-transparent bg-gradient-to-r from-[var(--pink)] to-[var(--violet)] text-white"
          : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--accent-strong)]"
      }`}
    >
      {children}
    </span>
  );
}
