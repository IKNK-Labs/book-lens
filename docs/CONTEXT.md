# Project Context

## Branch context

- 현재 작업 브랜치: `feature/user-session`
- 기준 브랜치: `develop`
- 작업 목표: Supabase Auth 기반 사용자 로그인/회원가입, 사용자 정보 표시, 마이페이지 개별 설정 연동

## Current implementation context

- `@supabase/ssr`, `@supabase/supabase-js`가 frontend dependencies에 있음.
- `/login`, `/signup`, `/auth/callback`, `/auth/confirm`, `/logout` 흐름이 존재함.
- `/settings`는 Supabase Auth 세션 기반 사용자 정보를 표시하고 `app_user`를 조회함.
- `/settings`는 `user_preference`를 조회/저장하며 현재 저장 필드는 `age_group`, `difficulty_level`, `response_length`, `instruction`임.
- `/` 홈은 실제 `/api/books` 응답 기반으로 최대 3개 도서를 표시하며 mock fallback을 사용하지 않음.
- 홈의 최근 대화/인기 캐릭터 mock 카드는 제거됐고, 실제 연동 전까지 빈 상태/안내 UI를 표시함.
- `/books`와 `/books/{id}`는 비로그인 공개 경로이며 실제 `/api/books` DB 목록/검색/상세 응답을 사용함.
- `/settings`, `/chat`, `/chat/{id}`는 로그인 보호 경로로 유지함.
- `/chat/{id}`는 `chatApi.greeting`/`chatApi.send`로 실제 캐릭터 greeting/대화 API와 연동됨 (`feature/ish`의 `CharacterChatShell.tsx` 반영).
- `vector-search`는 request-time FlagEmbedding lazy import crash를 피하기 위해 `BGE_M3_PRELOAD` 기반 startup preload를 지원함.
- 로컬 Windows/CPU 환경에서 `vector-search`를 검증할 때는 `BGE_M3_PRELOAD=import`, `BGE_M3_DEVICE=cpu`를 사용함.

## Moderation admin table note

- Moderation admin uses the unmanaged external table `forbidden_rules`.
- The repository does not create `forbidden_rules` with a Django migration.
- If the external table is missing, `/api/admin/forbidden-rules` returns 503 instead of exposing a database traceback.
- Schema creation for `forbidden_rules` remains an environment/setup task and is not changed in this branch.
- See `docs/FORBIDDEN_RULES_SCHEMA.md` for the minimal external table SQL example.
- `/api/admin/*` authorization is enforced by the frontend Supabase admin session guard before proxying to Django; direct public exposure of Django admin APIs requires a stronger backend JWT verification design.
- Deployment safety assumption: public traffic reaches Django admin APIs only through nginx/Next.js. The current repo deployment manifests expose public traffic through nginx while Django is an internal service/container port; if Django is ever exposed directly to the internet, backend Supabase JWT verification must be added before relying on `AllowAny` admin viewsets.
## Supabase data connection rules

- Supabase Auth는 실제 로그인/회원가입을 담당한다.
- `auth.users.id`는 `app_user.auth_user_id`와 연결된다.
- 서비스 내부 사용자 기준은 `app_user.id`다.
- `user_preference`는 `app_user.id` 기준으로 연결한다.
- 마이페이지 설정 저장은 `user_preference`와 연결한다.

## Recommended strategy for today

1. checkpoint commit 전 diff/secret/doc 정합성 검수
2. backend check/test와 vector-search preload smoke 재확인
3. frontend build와 Playwright 핵심 smoke 재확인
4. 남은 실제 OAuth/user_preference 수동 smoke 결과는 PR 본문에 명시

## Out of scope for this documentation task

이번 문서 추가 작업에서는 구현하지 않음:

- Auth 구현 수정
- DB migration 추가
- RLS 정책 변경
- Django users API 추가
- Supabase JWT 검증 구현
