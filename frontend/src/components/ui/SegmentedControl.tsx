export function SegmentedControl({
  label,
  options,
  active,
}: {
  label: string;
  options: string[];
  active: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
      <span className="text-sm font-black text-[var(--accent-strong)]">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option === active;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={isActive}
              className={`rounded-full border px-3 py-2 text-xs font-extrabold sm:text-sm ${
                isActive
                  ? "border-transparent bg-[var(--accent)] text-white"
                  : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted)]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
