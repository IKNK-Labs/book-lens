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

// ── Books ──────────────────────────────────────────────

export type BookPayload = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  description: string;
};

export type BookResponse = BookPayload & {
  id: number;
  created_at: string;
  content: { content: string } | null;
};

export const adminBooksApi = {
  create: (payload: BookPayload) =>
    request<BookResponse>("/api/admin/books/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<BookPayload>) =>
    request<BookResponse>(`/api/admin/books/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    request<void>(`/api/admin/books/${id}/`, { method: "DELETE" }),

  list: () => request<BookResponse[]>("/api/admin/books/"),
};
