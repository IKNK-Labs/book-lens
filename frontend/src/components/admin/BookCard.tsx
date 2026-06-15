type BookCardProps = {
  title: string;
  author: string;
  publisher: string;
  isbn?: string;
  description: string;
  onEdit?: () => void;
};

export default function BookCard({ title, author, publisher, isbn, description, onEdit }: BookCardProps) {
  const shortDesc = description.length > 300 ? description.slice(0, 300) + "…" : description;

  return (
    <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-[20px] p-3 flex flex-col">
      <div className="h-14 rounded-2xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] grid place-items-center text-2xl mb-2.5 shrink-0">
        📖
      </div>

      <b className="block text-[13px] text-[#65506e] leading-snug mb-1">{title}</b>

      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mb-2">
        <span className="text-[10px] text-[#9b74ad]">저자 <span className="text-[#74617a] font-medium">{author}</span></span>
        <span className="text-[10px] text-[#9b74ad]">출판사 <span className="text-[#74617a] font-medium">{publisher}</span></span>
        {isbn && (
          <span className="text-[10px] text-[#9b74ad]">ISBN <span className="text-[#74617a] font-medium">{isbn}</span></span>
        )}
      </div>

      <p className="m-0 text-[10px] text-[#94859d] leading-relaxed flex-1">
        {shortDesc}
      </p>

      <div className="mt-2.5">
        <button
          type="button"
          onClick={onEdit}
          className="w-full rounded-full px-2 py-1.5 text-[10px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0]"
        >
          수정
        </button>
      </div>
    </div>
  );
}
