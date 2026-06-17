type CharacterCardProps = {
  emoji: string;
  imageUrl?: string;
  name: string;
  description: string;
  onClick?: () => void;
  isSelected?: boolean;
};

export default function CharacterCard({
  emoji,
  imageUrl,
  name,
  description,
  onClick,
  isSelected,
}: CharacterCardProps) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-[20px] p-3 min-h-[128px] transition-all ${
        onClick ? "cursor-pointer" : ""
      } ${
        isSelected
          ? "border-[#c7a8ff] bg-gradient-to-br from-[#fff0f7] to-[#f4efff] shadow-[0_0_0_2px_rgba(199,168,255,0.25)]"
          : "bg-[#fff9fc] border-[#eadcf0]"
      }`}
    >
      <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#fff2bf] grid place-items-center text-3xl mb-2 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          emoji
        )}
      </div>
      <b className="block text-[12px] text-[#65506e]">{name}</b>
      <span className="block mt-1 text-[10px] text-[#94859d] leading-snug">
        {description}
      </span>
    </div>
  );
}
