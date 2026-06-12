type BookCardProps = {
  emoji?: string;
  title: string;
  description: string;
};

export default function BookCard({
  emoji = "📖",
  title,
  description,
}: BookCardProps) {
  return (
    <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-[20px] p-3 min-h-[128px]">
      <div className="h-16 rounded-2xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] grid place-items-center text-2xl mb-2">
        {emoji}
      </div>
      <b className="block text-[12px] text-[#65506e]">{title}</b>
      <span className="block mt-1 text-[10px] text-[#94859d] leading-snug">
        {description}
      </span>
    </div>
  );
}
