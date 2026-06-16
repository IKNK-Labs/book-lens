export class ApiError extends Error {
  constructor(
    public status: number,
    public data: Record<string, unknown>
  ) {
    super(`API error ${status}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data);
  }

  return res.json() as Promise<T>;
}

// ── Characters ─────────────────────────────────────────

export type CharacterPayload = {
  book_id: number;
  name: string;
  role?: string;
  gender?: string;
  emoji?: string;
  description?: string;
  profile_image_url?: string;
};

export type CharacterResponse = CharacterPayload & {
  id: number;
  created_at: string | null;
};

export const adminCharactersApi = {
  list: (bookId: number) =>
    request<CharacterResponse[]>(`/api/admin/characters?book_id=${bookId}`),

  create: (payload: CharacterPayload) =>
    request<CharacterResponse>("/api/admin/characters", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<CharacterPayload>) =>
    request<CharacterResponse>(`/api/admin/characters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    request<void>(`/api/admin/characters/${id}`, { method: "DELETE" }),
};

// ── Books ──────────────────────────────────────────────

export type BookPayload = {
  isbn: string | null;
  title: string;
  author: string;
  publisher: string;
  description: string;
  content?: { content: string };
};

export type BookResponse = BookPayload & {
  id: number;
  updated_at: string;
  content: { content: string } | null;
};

export const adminBooksApi = {
  create: (payload: BookPayload) =>
    request<BookResponse>("/api/admin/books", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<BookPayload>) =>
    request<BookResponse>(`/api/admin/books/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    request<void>(`/api/admin/books/${id}`, { method: "DELETE" }),

  list: () => request<BookResponse[]>("/api/admin/books"),
};
