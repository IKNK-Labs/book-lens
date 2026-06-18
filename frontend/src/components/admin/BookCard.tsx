type BookCardProps = {
  title: string;
  author: string;
  publisher: string;
  isbn?: string;
  description: string;
  isEmbedded?: boolean;
  isEmbedding?: boolean;
  onEdit?: () => void;
  onEmbed?: () => void;
};

export default function BookCard({
  title,
  author,
  publisher,
  isbn,
  description,
  isEmbedded = false,
  isEmbedding = false,
  onEdit,
  onEmbed,
}: BookCardProps) {
  const shortDesc = description.length > 300 ? description.slice(0, 300) + "..." : description;

  return (
    <div className="bg-[#fff9fc] border border-[#eadcf0] rounded-[20px] p-3 flex flex-col">
      <div className="relative h-14 rounded-2xl bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] grid place-items-center text-2xl mb-2.5 shrink-0">
        📖
        <button
          type="button"
          onClick={onEmbed}
          disabled={isEmbedding}
          title={isEmbedded ? "임베딩 완료" : "임베딩 실행"}
          aria-label={`${title} 임베딩 ${isEmbedded ? "완료" : "실행"}`}
          className={[
            "group absolute right-2 top-2 inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[10px] font-extrabold shadow-[0_8px_18px_rgba(112,78,150,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(112,78,150,0.24)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70",
            isEmbedded
              ? "border-[#9d74f0] bg-gradient-to-r from-[#9b6dff] to-[#c992ff] text-white"
              : "border-white/80 bg-white/95 text-[#7d5ba6] backdrop-blur",
          ].join(" ")}
        >
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              isEmbedded ? "bg-white" : "bg-[#c7a8ff]",
              isEmbedding ? "animate-pulse" : "",
            ].join(" ")}
          />
          <span>{isEmbedding ? "진행중" : "임베딩"}</span>
        </button>
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
