# Project Context

## Branch context

- 현재 작업 브랜치: `feature/user-session`
- 기준 브랜치: `develop`
- 작업 목표: Supabase Auth 기반 사용자 로그인/회원가입, 사용자 정보 표시, 마이페이지 개별 설정 연동

## Current implementation context

- 현재 `develop`에는 frontend Supabase Auth 뼈대가 이미 있음.
- `@supabase/ssr`, `@supabase/supabase-js`가 frontend dependencies에 있음.
- `/login`, `/signup`, `/auth/callback`, `/auth/confirm`, `/logout` 흐름이 존재함.
- middleware가 `/books`, `/settings`, `/chat`을 보호 경로로 보고 있음.
- `/settings` 마이페이지 화면은 있으나 user preference는 `mockPreference` 기반임.
- 저장 버튼은 실제 저장 동작에 연결되어 있지 않음.
- Django backend에는 아직 users 앱, `/api/users/me/settings/` API, Supabase JWT 검증이 없음.

## Supabase data connection rules

- Supabase Auth는 실제 로그인/회원가입을 담당한다.
- `auth.users.id`는 `app_user.auth_user_id`와 연결된다.
- 서비스 내부 사용자 기준은 `app_user.id`다.
- `user_preference`는 `app_user.id` 기준으로 연결한다.
- 마이페이지 설정 저장은 `user_preference`와 연결한다.

## Recommended strategy for today

1. Supabase Auth 환경/세션 흐름 안정화
2. 마이페이지 사용자 정보 표시
3. `user_preference` 실제 조회/저장
4. build + Playwright smoke + 수동 OAuth 확인

## Out of scope for this documentation task

이번 문서 추가 작업에서는 구현하지 않음:

- Auth 구현 수정
- `user_preference` 저장 구현
- DB migration 추가
- RLS 정책 변경
- Django users API 추가
- Supabase JWT 검증 구현
