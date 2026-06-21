# Chat Agent Session Behavior

## Overview

BookLens chat now continues by `chat_session`, not by character alone. A
`chat_session` is a user-owned character conversation thread, not a browser or
Supabase login session. The persisted transcript is stored in
`conversation_log` rows linked by `conversation_log.session_id`.

This document describes the current MVP behavior after the session-based chat
backend and frontend work. It intentionally avoids real test data values.

## API Flow

Current chat session APIs:

- `GET /api/chat/greeting`
- `POST /api/chat/sessions`
- `GET /api/chat/sessions`
- `GET /api/chat/sessions/{session_id}/messages`
- `POST /api/chat`
- `DELETE /api/chat/sessions/{session_id}`

`POST /api/chat` accepts placeholder-shaped input like:

```json
{
  "session_id": "<chat session id>",
  "character_id": "<character id>",
  "user_id": "<app_user.id or auth_user_id>",
  "message": "<user message>"
}
```

Do not document real identifiers or real message content in examples, reports,
or screenshots.

## Backend Behavior

- If `session_id` is provided, the backend verifies that the session belongs to
  the resolved user and that its character matches the requested character.
- If `session_id` is omitted, the backend finds the latest session for the
  user and character, or creates one when none exists.
- LangGraph prompt history uses only the selected session's recent
  `conversation_log` rows. The current limit is `HISTORY_LIMIT = 10` messages.
- The user message and assistant message are saved with the same `session_id`.
- `turn_index` is a message-level sequence. User and assistant messages receive
  separate increasing values.
- After response persistence, `chat_session.last_message_preview`,
  `last_active_at`, and `updated_at` are updated.

## Greeting Policy

- A greeting is display-only guidance, not transcript.
- Greeting responses are not automatically saved to `conversation_log`.
- The frontend shows greeting only when the messages API returns an empty
  transcript for the selected session.
- If transcript exists, greeting is not shown again.
- A greeting response uses an empty `assistant_log_id`, so feedback and report
  controls are not shown for that bubble.

## Current Exclusions

The exclusions below apply to conversation history and long-term memory. Existing
RAG-style retrieval used for book content or story context is a separate flow.
This session MVP means conversation logs were not expanded into embedding,
vector search, or RAG-backed long-term memory.

The session MVP does not add:

- conversation embeddings
- vector search over conversation history
- long-term memory backed by RAG
- context compression
- full-session transcript injection into every prompt
- backend Supabase JWT verification

The current backend chat APIs still accept user identity through body or query
parameters as a temporary flow. Backend JWT verification remains follow-up work.

## Verification Baseline

PR #45 and follow-up smoke checks verified the current behavior without
recording real test data values:

- frontend build passed
- backend system check passed
- Playwright mock desktop/mobile chat UI checks passed
- targeted Playwright check passed for stale send responses after session
  switches
- Newman-based real backend API smoke passed
- actual `/api/chat` LLM round trip passed
- transcript persistence and restore were confirmed
- session list preview update was confirmed
- cleanup delete succeeded
- messages lookup after delete returned a not-found style result

For destructive smoke, use a temporary Postman collection/environment and stop
if a session already exists for the selected user and character. Only a session
created with HTTP 201 during that smoke run may be deleted by cleanup.
