"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import BookCard from "@/components/admin/BookCard";
import { adminBooksApi, ApiError, type BookPayload, type BookResponse } from "@/lib/api";

type BookForm = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  description: string;
  content: string;
};

const emptyForm: BookForm = {
  isbn: "",
  title: "",
  author: "",
  publisher: "",
  description: "",
  content: "",
};

export default function Page() {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [editingBook, setEditingBook] = useState<BookResponse | null>(null);
  const [form, setForm] = useState<BookForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [autocompleteTitle, setAutocompleteTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadBooks() {
      setIsLoading(true);
      try {
        const items = await adminBooksApi.list(search);
        if (isCurrent) setBooks(items);
      } catch (err) {
        console.error(err);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadBooks();

    return () => {
      isCurrent = false;
    };
  }, [search]);

  const openEditModal = (book: BookResponse) => {
    setEditingBook(book);
    setForm({
      isbn: book.isbn ?? "",
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      description: book.description ?? "",
      content: book.content?.content ?? "",
    });
    setAutocompleteTitle("");
  };

  const closeModal = () => {
    setEditingBook(null);
    setForm(emptyForm);
  };

  const updateField = (field: keyof BookForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editingBook) return;
    if (!form.isbn.trim() || !form.title.trim() || !form.author.trim() || !form.publisher.trim()) {
      Swal.fire({
        icon: "warning",
        title: "필수 항목 미입력",
        text: "ISBN, 제목, 저자, 출판사는 필수입니다.",
        confirmButtonColor: "#c7a8ff",
      });
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
        content: form.content,
      };
      const updated = await adminBooksApi.update(editingBook.id, payload);
      const updatedBook = { ...updated, content: { content: form.content } };
      setBooks((prev) => prev.map((book) => (book.id === editingBook.id ? updatedBook : book)));
      closeModal();
      Swal.fire({ icon: "success", title: "수정되었습니다.", confirmButtonColor: "#c7a8ff" });
    } catch (err) {
      const message = err instanceof ApiError ? "저장에 실패했습니다. 입력값을 확인해 주세요." : "서버에 연결할 수 없습니다.";
      Swal.fire({ icon: "error", title: "저장 실패", text: message, confirmButtonColor: "#c7a8ff" });
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
          <p className="mt-1.5 text-[13px] text-[#94859d]">등록된 도서 목록을 확인하고 필요한 도서 정보를 수정합니다.</p>
        </div>
        <Link
          href="/admin/books/new"
          className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
        >
          + 책 등록
        </Link>
      </div>

      <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)]">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="m-0 text-[15px] text-[#72508c]">등록된 동화책 목록</h4>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="제목, 저자, 출판사, ISBN 검색"
            className="min-h-[34px] rounded-full border border-[#eadcf0] bg-[#fff9fc] px-3 text-[12px] text-[#74617a] outline-none focus:border-[#c7a8ff]"
          />
        </div>
        {isLoading ? (
          <p className="text-[12px] text-[#94859d] text-center py-8">도서 목록을 불러오는 중입니다.</p>
        ) : books.length === 0 ? (
          <p className="text-[12px] text-[#94859d] text-center py-8">등록된 동화책이 없습니다.</p>
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
            <p className="mt-1 mb-3 text-[12px] text-[#94859d]">도서 API에 저장된 기본 정보와 본문을 수정합니다.</p>

            <div className={fieldWrapCls + " mb-3"}>
              <label className={labelCls}>제목으로 자동완성</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={autocompleteTitle}
                  onChange={(event) => setAutocompleteTitle(event.target.value)}
                  placeholder="동화책 제목을 입력하세요"
                  className={inputCls + " flex-1"}
                />
                <button
                  type="button"
                  className="rounded-full px-4 py-1.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap"
                >
                  자동완성
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={fieldWrapCls}>
                <label className={labelCls}>ISBN *</label>
                <input type="text" value={form.isbn} onChange={(event) => updateField("isbn", event.target.value)} className={inputCls} />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>제목 *</label>
                <input type="text" value={form.title} onChange={(event) => updateField("title", event.target.value)} className={inputCls} />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>저자 *</label>
                <input type="text" value={form.author} onChange={(event) => updateField("author", event.target.value)} className={inputCls} />
              </div>
              <div className={fieldWrapCls}>
                <label className={labelCls}>출판사 *</label>
                <input type="text" value={form.publisher} onChange={(event) => updateField("publisher", event.target.value)} className={inputCls} />
              </div>
              <div className={fieldWrapCls + " sm:col-span-2"}>
                <label className={labelCls}>줄거리</label>
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  rows={3}
                  className="w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-none focus:border-[#c7a8ff]"
                />
              </div>
              <div className={fieldWrapCls + " sm:col-span-2"}>
                <label className={labelCls}>본문</label>
                <textarea
                  value={form.content}
                  onChange={(event) => updateField("content", event.target.value)}
                  rows={5}
                  className="w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-none focus:border-[#c7a8ff]"
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
