type BookCardProps = {
  emoji?: string;
  title: string;
  description: string;
  onEdit?: () => void;
  onAddCharacter?: () => void;
};

export default function BookCard({
  emoji = "📖",
  title,
  description,
  onEdit,
  onAddCharacter,
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
      <div className="flex gap-1.5 mt-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 rounded-full px-2 py-1.5 text-[10px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0]"
        >
          수정
        </button>
        <button
          type="button"
          onClick={onAddCharacter}
          className="flex-1 rounded-full px-2 py-1.5 text-[10px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2]"
        >
          캐릭터 추가
        </button>
      </div>
    </div>
  );
}
