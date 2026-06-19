"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, booksApi, type CharacterItem } from "../../lib/api";
import { Card } from "../ui/Card";

export function CharacterSelectShell({ bookId }: { bookId: string }) {
  const numericBookId = Number(bookId);
  const hasValidBookId = Boolean(numericBookId);
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [isLoading, setIsLoading] = useState(hasValidBookId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasValidBookId) {
      return;
    }

    booksApi
      .characters(numericBookId)
      .then((data) => setCharacters(data))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError("도서를 찾을 수 없습니다.");
        } else {
          setError("캐릭터 목록을 불러오지 못했습니다.");
        }
      })
      .finally(() => setIsLoading(false));
  }, [hasValidBookId, numericBookId]);

  if (!hasValidBookId) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">잘못된 도서 ID입니다.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm font-bold text-[var(--accent-strong)]">캐릭터 목록을 불러오는 중입니다.</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">{error}</p>
      </Card>
    );
  }

  if (characters.length === 0) {
    return (
      <Card>
        <h1 className="text-2xl font-black text-[var(--accent-strong)]">캐릭터 선택</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">등록된 캐릭터가 없습니다.</p>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-[-0.04em] text-[var(--accent-strong)]">캐릭터 선택</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">대화하고 싶은 캐릭터를 선택하세요.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((character) => (
          <Link
            key={character.id}
            href={`/chat/${character.id}`}
            className="block rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)] transition hover:border-[var(--accent)] hover:shadow-lg"
          >
            <div className="aspect-[4/5] min-h-[280px] overflow-hidden rounded-[24px] bg-[var(--surface-soft)] sm:min-h-[320px]">
              {character.profile_image_url ? (
                <img
                  src={character.profile_image_url}
                  alt={character.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="grid h-full place-items-center bg-gradient-to-br from-[var(--surface-soft)] via-[var(--accent-soft)] to-[var(--surface-muted)] text-5xl">
                  {character.emoji ?? "📖"}
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                {character.role ?? "캐릭터"}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-[var(--accent-strong)]">
                {character.name}
              </h2>
              {character.description ? (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                  {character.description}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
