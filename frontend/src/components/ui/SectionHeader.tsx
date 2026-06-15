export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      {eyebrow ? <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p> : null}
      <h1 className="text-3xl font-black tracking-[-0.06em] text-[var(--accent-strong)] sm:text-4xl">{title}</h1>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">{description}</p> : null}
    </div>
  );
}
