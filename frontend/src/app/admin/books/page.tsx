"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import BookCard from "@/components/admin/BookCard";
import { adminBooksApi, type BookResponse, type BookPayload, ApiError } from "@/lib/api";

type BookForm = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  description: string;
};

export default function Page() {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [editingBook, setEditingBook] = useState<BookResponse | null>(null);
  const [form, setForm] = useState<BookForm>({ isbn: "", title: "", author: "", publisher: "", description: "" });
  const [autocompleteTitle, setAutocompleteTitle] = useState("");
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    adminBooksApi.list().then(setBooks).catch(console.error);
  }, []);

  const openEditModal = (book: BookResponse) => {
    setEditingBook(book);
    setForm({
      isbn: book.isbn ?? "",
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      description: book.description ?? "",
    });
    setAutocompleteTitle("");
  };

  const closeModal = () => setEditingBook(null);

  const handleAutocomplete = async () => {
    const titleToSearch = autocompleteTitle.trim() || form.title.trim();
    if (!titleToSearch) {
      Swal.fire({ icon: "warning", title: "제목 미입력", text: "자동완성할 동화책 제목을 입력해주세요.", confirmButtonColor: "#c7a8ff" });
      return;
    }
    setIsAutocompleting(true);
    try {
      const res = await fetch("/api/admin/books/generate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleToSearch }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "자동완성에 실패했습니다.");
      }
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        author: data.author ?? prev.author,
        publisher: data.publisher ?? prev.publisher,
        description: data.description ?? prev.description,
      }));
    } catch (err) {
      Swal.fire({ icon: "error", title: "자동완성 실패", text: err instanceof Error ? err.message : "서버에 연결할 수 없습니다.", confirmButtonColor: "#c7a8ff" });
    } finally {
      setIsAutocompleting(false);
    }
  };

  const updateField = (field: keyof BookForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editingBook) return;
    if (!form.title.trim() || !form.author.trim() || !form.publisher.trim()) {
      Swal.fire({ icon: "warning", title: "필수 항목 미입력", text: "제목, 저자, 출판사는 필수입니다.", confirmButtonColor: "#c7a8ff" });
      return;
    }
    setIsSaving(true);
    try {
      const payload: Partial<BookPayload> = {
        isbn: form.isbn.trim(),
        title: form.title.trim(),
        author: form.author.trim(),
        publisher: form.publisher.trim(),
        description: form.description.trim(),
      };
      const updated = await adminBooksApi.update(editingBook.id, payload);
      setBooks((prev) => prev.map((b) => (b.id === editingBook.id ? updated : b)));
      closeModal();
      Swal.fire({ icon: "success", title: "수정되었습니다", confirmButtonColor: "#c7a8ff" });
    } catch (err) {
      if (err instanceof ApiError) {
        Swal.fire({ icon: "error", title: "저장 실패", text: "저장에 실패했습니다.", confirmButtonColor: "#c7a8ff" });
      } else {
        Swal.fire({ icon: "error", title: "네트워크 오류", text: "서버에 연결할 수 없습니다.", confirmButtonColor: "#c7a8ff" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = "w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]";
  const fieldWrapCls = "bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5";
  const labelCls = "block text-[10px] font-bold text-[#9b74ad] mb-1.5";

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">동화책 관리</h3>
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
        <h4 className="m-0 mb-3 text-[15px] text-[#72508c]">등록된 동화책 목록</h4>
        {books.length === 0 ? (
          <p className="text-[12px] text-[#94859d] text-center py-8">
            등록된 동화책이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {books.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                author={book.author}
                publisher={book.publisher}
                isbn={book.isbn}
                description={book.description ?? ""}
                onEdit={() => openEditModal(book)}
              />
            ))}
          </div>
        )}
      </section>

      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#eadcf0] rounded-3xl shadow-[0_24px_60px_rgba(130,90,160,0.22)] p-4">
            <h3 className="text-lg tracking-tight text-[#7d5ba6] m-0 mb-1">동화책 정보 수정</h3>
            <p className="mt-1 mb-3 text-[12px] text-[#94859d]">
              AI 자동완성 또는 직접 수정하세요.
            </p>

            <div className={fieldWrapCls + " mb-3"}>
              <label className={labelCls}>제목으로 자동완성</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={autocompleteTitle}
                  onChange={(e) => setAutocompleteTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAutocomplete()}
                  placeholder="동화책 제목을 입력하세요 (예: 백설공주, 어린왕자)"
                  className={inputCls + " flex-1"}
                />
                <button
                  type="button"
                  onClick={handleAutocomplete}
                  disabled={isAutocompleting}
                  className="rounded-full px-4 py-1.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap disabled:opacity-60"
                >
                  {isAutocompleting ? "생성 중..." : "AI 자동완성"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={fieldWrapCls}>
                <label className={labelCls}>ISBN</label>
                <input type="text" value={form.isbn} onChange={(e) => updateField("isbn", e.target.value)} placeholder="예: 9788925557373" className={inputCls} />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>제목 *</label>
                <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="동화책 제목" className={inputCls} />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>저자 *</label>
                <input type="text" value={form.author} onChange={(e) => updateField("author", e.target.value)} placeholder="저자명" className={inputCls} />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>출판사 *</label>
                <input type="text" value={form.publisher} onChange={(e) => updateField("publisher", e.target.value)} placeholder="출판사명" className={inputCls} />
              </div>
              <div className={fieldWrapCls + " sm:col-span-2"}>
                <label className={labelCls}>줄거리</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="동화책의 줄거리를 입력하세요"
                  rows={12}
                  className="w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-y focus:border-[#c7a8ff]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={closeModal} className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0]">
                취소
              </button>
              <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] disabled:opacity-50">
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
