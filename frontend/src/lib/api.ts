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

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

function withSearch(path: string, search?: string) {
  if (!search?.trim()) return path;
  const params = new URLSearchParams({ search: search.trim() });
  return `${path}?${params.toString()}`;
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

export type ApprovalStatus = "draft" | "approved" | "rejected";

export type PersonaPayload = {
  character_id: number;
  book_id: number;
  greeting_open?: string;
  greeting_close?: string;
  personality?: string;
  speech_style?: string;
  catchphrase?: string;
  bio?: string;
  tags?: string[];
  opening_scene?: string;
  era?: string;
  background?: string;
  user_role?: string;
  user_relationship?: string;
  system_prompt?: string;
  approved_status?: ApprovalStatus;
};

export type PersonaResponse = PersonaPayload & {
  id: number;
  created_at: string | null;
  updated_at: string | null;
};

export const adminPersonasApi = {
  list: (characterId: number) =>
    request<PersonaResponse[]>(`/api/admin/personas?character_id=${characterId}`),

  create: (payload: PersonaPayload) =>
    request<PersonaResponse>("/api/admin/personas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<PersonaPayload>) =>
    request<PersonaResponse>(`/api/admin/personas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    request<void>(`/api/admin/personas/${id}`, { method: "DELETE" }),
};

export type BookPayload = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  description: string;
  content?: string | { content: string };
};

export type BookResponse = Omit<BookPayload, "content"> & {
  id: number;
  updated_at: string;
  content: { content: string } | null;
  character_count: number;
  featured_character_id: number | null;
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

  list: (search?: string) => request<BookResponse[]>(withSearch("/api/admin/books", search)),

  detail: (id: number) => request<BookResponse>(`/api/admin/books/${id}`),
};

export const booksApi = {
  list: (search?: string) => request<BookResponse[]>(withSearch("/api/books", search)),

  detail: (id: number) => request<BookResponse>(`/api/books/${id}`),
};
