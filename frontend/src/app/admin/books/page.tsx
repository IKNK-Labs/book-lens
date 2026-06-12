import Link from "next/link";
import BookCard from "@/components/admin/BookCard";

const SAMPLE_BOOKS: { emoji: string; title: string; description: string }[] = [
  // 데이터 연동 전까지는 비워둡니다.
];

export default function Page() {
  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">
            동화책 관리
          </h3>
          <p className="mt-1.5 text-[13px] text-[#94859d]">
            등록된 동화책 목록을 확인하고 새 동화책을 추가합니다.
          </p>
        </div>
        <Link
          href="/admin/books/new"
          className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
        >
          + 책 등록
        </Link>
      </div>

      <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)]">
        <h4 className="m-0 mb-3 text-[15px] text-[#72508c]">
          등록된 동화책 목록
        </h4>
        {SAMPLE_BOOKS.length === 0 ? (
          <div className="bg-[#fff9fc] border border-dashed border-[#eadcf0] rounded-2xl p-8 text-center text-[12px] text-[#94859d]">
            아직 등록된 동화책이 없습니다. &quot;+ 책 등록&quot; 버튼을 눌러
            새 동화책을 추가해보세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SAMPLE_BOOKS.map((book) => (
              <BookCard key={book.title} {...book} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
