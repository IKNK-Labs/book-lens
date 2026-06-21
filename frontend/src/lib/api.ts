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

export type ForbiddenRuleType = "word" | "phrase" | "regex";
export type ForbiddenRuleSeverity = "block" | "warn" | "info";
export type ForbiddenRuleTarget = "user_input" | "bot_output" | "both";

export type ForbiddenRulePayload = {
  pattern: string;
  rule_type: ForbiddenRuleType;
  description?: string | null;
  severity: ForbiddenRuleSeverity;
  target: ForbiddenRuleTarget;
  category?: string | null;
  is_active: boolean;
};

export type ForbiddenRuleResponse = ForbiddenRulePayload & {
  id: string;
  created_at: string;
  updated_at: string;
};

export const adminForbiddenRulesApi = {
  list: () => request<ForbiddenRuleResponse[]>("/api/admin/forbidden-rules"),

  create: (payload: ForbiddenRulePayload) =>
    request<ForbiddenRuleResponse>("/api/admin/forbidden-rules", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<ForbiddenRulePayload>) =>
    request<ForbiddenRuleResponse>(`/api/admin/forbidden-rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<void>(`/api/admin/forbidden-rules/${id}`, { method: "DELETE" }),
};

export type AdminDashboardResponse = {
  metrics: {
    today_conversations: number;
    active_users: number;
    review_needed: number;
    total_books: number;
    total_characters: number;
  };
  top_characters: {
    id: number;
    name: string;
    role: string | null;
    emoji: string | null;
    profile_image_url: string | null;
    book_title: string;
    conversation_count: number;
  }[];
  top_books: {
    id: number;
    title: string;
    author: string;
    conversation_count: number;
  }[];
  feedback: {
    like_count: number;
    dislike_count: number;
    report_count: number;
  };
  persona_status: {
    approved: number;
    draft: number;
    rejected: number;
  };
  safety: {
    flagged_today: number;
    active_rules: number;
    reports: number;
  };
};

export const adminDashboardApi = {
  detail: () => request<AdminDashboardResponse>("/api/admin/dashboard"),
};

export type BookPayload = {
  isbn: string | null;
  title: string;
  author: string;
  publisher: string;
  description: string;
  content?: string | { content: string };
};

export type BookResponse = Omit<BookPayload, "content"> & {
  id: number;
  updated_at: string;
  content: { content: string; embed_status?: string } | null;
  character_count: number;
  featured_character_id: number | null;
};

export type BookVectorSearchResult = {
  book_id: number;
  title: string;
  author: string;
  publisher: string;
  chunk_id: number;
  chunk_index: number;
  content: string;
  distance: number;
};

export type BookVectorSearchResponse = {
  results: BookVectorSearchResult[];
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

  embed: (id: number) =>
    request<BookResponse>(`/api/admin/books/${id}/embed`, { method: "POST" }),
};

export type CharacterItem = {
  id: number;
  name: string;
  role: string | null;
  description: string | null;
  emoji: string | null;
  profile_image_url: string | null;
};

export type GreetingResponse = {
  greeting: string;
  assistant_log_id: string;
  character_name: string;
  character_role: string | null;
  character_emoji: string | null;
  character_profile_image_url: string | null;
  book_id: number;
  book_title: string;
  has_history: boolean;
};

export type ChatSession = {
  id: string;
  character_id: number;
  character_name: string;
  character_role: string | null;
  character_emoji: string | null;
  character_profile_image_url: string | null;
  book_id: number;
  book_title: string;
  title: string | null;
  last_message_preview: string | null;
  last_active_at: string | null;
};

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  message: string;
  is_flagged: boolean;
  turn_index: number | null;
  created_at: string | null;
};

export type ChatSendResponse = {
  session_id: string;
  response: string;
  category: string;
  is_flagged: boolean;
  assistant_log_id: string;
};

export type FeedbackType = "like" | "dislike" | "report";

export type ConversationFeedbackResponse = {
  id: string;
  conversation_log_id: number;
  feedback_type: FeedbackType;
  reason: string | null;
  created: boolean;
};

export const booksApi = {
  list: (search?: string) => request<BookResponse[]>(withSearch("/api/books", search)),

  detail: (id: number) => request<BookResponse>(`/api/books/${id}`),

  characters: (bookId: number) =>
    request<CharacterItem[]>(`/api/books/${bookId}/characters`),

  vectorSearch: (query: string, limit = 10) =>
    request<BookVectorSearchResponse>("/api/books/vector-search", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    }),
};

export const chatApi = {
  greeting: (characterId: number, userId?: string) => {
    const params = new URLSearchParams({ character_id: String(characterId) });
    if (userId) params.set("user_id", userId);
    return request<GreetingResponse>(`/api/chat/greeting?${params.toString()}`);
  },

  sessions: (userId: string) => {
    const params = new URLSearchParams({ user_id: userId });
    return request<ChatSession[]>(`/api/chat/sessions?${params.toString()}`);
  },

  createSession: (characterId: number, userId: string) =>
    request<ChatSession>("/api/chat/sessions", {
      method: "POST",
      body: JSON.stringify({
        character_id: characterId,
        user_id: userId,
      }),
    }),

  deleteSession: (sessionId: string, userId: string) => {
    const params = new URLSearchParams({ user_id: userId });
    return request<void>(`/api/chat/sessions/${sessionId}?${params.toString()}`, {
      method: "DELETE",
    });
  },

  messages: (sessionId: string, userId: string, limit?: number) => {
    const params = new URLSearchParams({ user_id: userId });
    if (limit) params.set("limit", String(limit));
    return request<ChatMessage[]>(
      `/api/chat/sessions/${sessionId}/messages?${params.toString()}`,
    );
  },

  send: (characterId: number, message: string, userId?: string, sessionId?: string) =>
    request<ChatSendResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        character_id: characterId,
        message,
        ...(userId ? { user_id: userId } : {}),
        ...(sessionId ? { session_id: sessionId } : {}),
      }),
    }),

  feedback: (payload: {
    conversation_log_id: string;
    feedback_type: FeedbackType;
    reason?: string;
    user_id?: string;
  }) =>
    request<ConversationFeedbackResponse>("/api/chat/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
