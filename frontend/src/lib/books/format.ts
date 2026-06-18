import type { Book } from "../../data/mock";
import type { BookResponse } from "../api";

export function toCardBook(book: BookResponse): Book {
  const description = book.description || book.content?.content || "등록된 소개가 없습니다.";

  return {
    id: String(book.id),
    title: book.title,
    description,
    coverEmoji: "📚",
    characterCount: book.character_count ?? 0,
    genres: [book.publisher || "도서"],
    featuredCharacterId: book.featured_character_id ? String(book.featured_character_id) : "",
    summary: description,
    recommendedFor: "등록된 도서 상세를 확인해 보세요.",
    readingTime: "상세 보기",
    label: book.author || "작가 미상",
  };
}
