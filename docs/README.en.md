<p align="right">
  <a href="../README.md">Language</a> · <a href="README.ko.md">한국어</a> · <strong>English</strong>
</p>

# Book Lens

**Book Lens** is an AI-powered story experience service that connects book discovery, character selection, session-based AI chat, user preferences, and admin operations in one workflow.

<p align="center">
  <img src="assets/service/home.png" width="47%" alt="Book Lens user home screen">
  <img src="assets/admin/dashboard.png" width="47%" alt="Book Lens admin dashboard">
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Current Limitations and Follow-ups](#current-limitations-and-follow-ups)
- [Docs and Assets](#docs-and-assets)

---

## Overview

Book Lens helps users explore storybooks, select characters, and continue conversations with AI characters through persisted chat sessions. Admin users can register books and characters, run embeddings, manage personas, and configure moderation rules.

This repository contains the frontend, backend, infrastructure configuration, and testing documentation.

```text
book-lens/
├── frontend/       # Next.js user/admin screens
├── backend/        # Django REST Framework API
├── infra/          # nginx reverse proxy configuration
├── docs/           # project documentation and README image assets
├── postman/        # API smoke test materials
└── docker-compose.yml
```

---

## Key Features

### User Features

- Book list and book detail screens
- Content-based book search flow
- Character selection per book
- Character chat session creation and transcript restoration
- User preference settings for response experience
- Separation between public routes and login-protected routes

### Admin Features

- Admin login and dashboard
- Book creation and management
- Embedding execution and completion status checks
- Character creation and character list management
- Persona management
- Forbidden-rule management
- Test chat for response checks

---

## Screenshots

### User Flow

| Home | Content Search |
|---|---|
| <img src="assets/service/home.png" width="420" alt="User home screen"> | <img src="assets/service/content-search.png" width="420" alt="Content search screen"> |

| Book Detail | Character Selection |
|---|---|
| <img src="assets/service/book-detail.png" width="420" alt="Book detail screen"> | <img src="assets/service/character-select.png" width="420" alt="Character selection screen"> |

| Chat | My Page |
|---|---|
| <img src="assets/service/chat.png" width="420" alt="Chat screen"> | <img src="assets/service/my-page.png" width="420" alt="My page screen"> |

### Admin Flow

| Dashboard | Book Creation |
|---|---|
| <img src="assets/admin/dashboard.png" width="420" alt="Admin dashboard"> | <img src="assets/admin/book-create.png" width="420" alt="Book creation screen"> |

| Embedding | Character Management |
|---|---|
| <img src="assets/admin/embedding-run.png" width="420" alt="Embedding execution screen"> | <img src="assets/admin/character-management.png" width="420" alt="Character management screen"> |

| Forbidden Rules | Test Chat |
|---|---|
| <img src="assets/admin/forbidden-rules.png" width="420" alt="Forbidden rules screen"> | <img src="assets/admin/test-chat.png" width="420" alt="Admin test chat screen"> |

<details>
<summary>View all user screenshots</summary>

| Screen | Default State |
|---|---|
| <img src="assets/service/home.png" width="420" alt="User home screen"> | <img src="assets/service/home-default.png" width="420" alt="User home default state"> |
| <img src="assets/service/content-search.png" width="420" alt="Content search screen"> | <img src="assets/service/content-search-default.png" width="420" alt="Content search default state"> |
| <img src="assets/service/book-detail.png" width="420" alt="Book detail screen"> | <img src="assets/service/book-detail-default.png" width="420" alt="Book detail default state"> |
| <img src="assets/service/character-select.png" width="420" alt="Character selection screen"> | <img src="assets/service/character-select-default.png" width="420" alt="Character selection default state"> |
| <img src="assets/service/chat.png" width="420" alt="Chat screen"> | <img src="assets/service/chat-default.png" width="420" alt="Chat default state"> |
| <img src="assets/service/my-page.png" width="420" alt="My page screen"> | <img src="assets/service/my-page-default.png" width="420" alt="My page default state"> |
| <img src="assets/service/user-login.png" width="300" alt="User login screen"> | <img src="assets/service/user-login-default.png" width="300" alt="User login default state"> |

</details>

<details>
<summary>View all admin screenshots</summary>

| Screen | Screen |
|---|---|
| <img src="assets/admin/admin-login.png" width="300" alt="Admin login screen"> | <img src="assets/admin/dashboard.png" width="420" alt="Admin dashboard"> |
| <img src="assets/admin/book-create.png" width="420" alt="Book creation screen"> | <img src="assets/admin/embedding-run.png" width="420" alt="Embedding execution screen"> |
| <img src="assets/admin/embedding-complete.png" width="420" alt="Embedding complete screen"> | <img src="assets/admin/character-management.png" width="420" alt="Character management screen"> |
| <img src="assets/admin/character-create.png" width="300" alt="Character creation screen"> | <img src="assets/admin/persona-management.png" width="300" alt="Persona management screen"> |
| <img src="assets/admin/forbidden-rules.png" width="420" alt="Forbidden rules screen"> | <img src="assets/admin/test-chat.png" width="420" alt="Admin test chat screen"> |

</details>

---

## Tech Stack

| Area | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Supabase SSR/Auth |
| Backend | Django, Django REST Framework, Gunicorn |
| AI / RAG | Google GenAI, FlagEmbedding, BGE-M3, pgvector, LangGraph |
| Database | PostgreSQL, Supabase integration |
| Infra | Docker, Docker Compose, nginx reverse proxy |
| Test / Smoke | Django check/test, pytest, Playwright smoke, Newman smoke |

---

## Architecture

```mermaid
flowchart LR
    U[User] --> NGINX[nginx reverse proxy]
    A[Admin] --> NGINX

    NGINX --> FE[Next.js frontend]
    NGINX --> BE[Django REST backend]

    FE --> SA[Supabase Auth]
    FE -->|through /api/admin| BE

    BE --> PG[(PostgreSQL + pgvector)]
    BE --> GEN[Google GenAI / LLM]
    BE --> BOOKS[books]
    BE --> CHARS[characters]
    BE --> CHAT[chat]
    BE --> MOD[moderation]
```

`nginx` routes `/` and `/admin` screens to Next.js, while general `/api/` requests are proxied to Django. Admin API traffic is designed around the frontend Supabase admin session guard before reaching Django APIs.

---

## Getting Started

### 1. Frontend Dev Server

```bash
cd frontend
npm install
npm run dev
```

### 2. Backend Dev Server

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver
```

The backend requires environment variables for PostgreSQL, Supabase, Google GenAI, and embedding model settings. Manage real values through `.env` or the runtime environment, and do not expose secrets in docs, logs, or PR bodies.

### 3. Docker Compose

```bash
docker compose up --build
```

The Docker Compose setup runs `nginx`, `frontend`, and `django`. PostgreSQL is expected to be provided through external DB connection environment variables.

---

## Testing

Use the following commands as the baseline checks.

```bash
cd frontend && npm run build
cd backend && python manage.py check
cd backend && python manage.py test --noinput
```

Additional smoke criteria are documented in:

- `docs/TESTING.md`
- `docs/chat-agent-session-behavior.md`

Main verification points:

- Confirm separation between public routes and login-protected routes
- Run desktop/mobile smoke checks for home, books, book detail, chat, and settings screens
- Confirm chat session creation, transcript persistence/restoration, cleanup delete, and not-found behavior after delete
- Confirm backend process survival after vector-search preload configuration
- Do not expose production DB values, service role keys, or real personal data in test artifacts

---

## Current Limitations and Follow-ups

- The chat session MVP supports session-scoped transcript persistence and restoration, but it does not extend the full conversation history into long-term RAG memory.
- Moderation admin uses the external `forbidden_rules` table; creating that table is treated as an environment/setup task.
- Admin API protection currently assumes nginx/Next.js routing and the frontend Supabase admin session guard. If Django is directly exposed to the internet, backend Supabase JWT verification must be added.
- The project currently emphasizes local and documented verification. A follow-up improvement would be to add GitHub Actions-based automated checks.

---

## Docs and Assets

- Image assets: `docs/assets/`
- Asset filename mapping: `docs/assets/ASSET_MAPPING.md`
- Testing guide: `docs/TESTING.md`
- Chat session behavior: `docs/chat-agent-session-behavior.md`
- Forbidden rules schema reference: `docs/FORBIDDEN_RULES_SCHEMA.md`

---

## License

Source code is licensed under the repository license notice. See the root README and license-related repository files for details.
