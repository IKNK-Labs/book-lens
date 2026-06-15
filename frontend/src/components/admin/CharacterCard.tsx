type CharacterCardProps = {
  emoji: string;
  name: string;
  description: string;
};

export default function CharacterCard({
  emoji,
  name,
  description,
}: CharacterCardProps) {
  return (
    <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-[20px] p-3 min-h-[128px]">
      <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#fff2bf] grid place-items-center text-3xl mb-2">
        {emoji}
      </div>
      <b className="block text-[12px] text-[#65506e]">{name}</b>
      <span className="block mt-1 text-[10px] text-[#94859d] leading-snug">
        {description}
      </span>
    </div>
  );
}
