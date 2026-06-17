# Testing Guide

## Basic tests

- `cd frontend && npm run build`
- `cd backend && python manage.py check`
- `cd backend && python manage.py test`

## Auth smoke

- `/settings` 미로그인 접근 시 `/login` redirect
- `/login` 렌더링
- Google 로그인 버튼 렌더링
- 로그인 후 `/settings` 접근
- 로그아웃 후 `/settings` 재접근 시 `/login` redirect

## My page settings

- 로그인 사용자 정보 표시
- `user_preference` 조회
- `user_preference` 저장
- 새로고침 후 저장값 유지

## Playwright criteria

- Auth 연동에는 Playwright smoke test가 필요하다.
- 단, Google OAuth 외부 화면 전체를 CI에서 자동화하지 않는다.
- Google OAuth 실제 계정 로그인은 수동 확인 대상으로 둔다.
- 자동화가 필요하면 Supabase 테스트 이메일/비밀번호 계정 또는 저장된 `storageState`를 사용한다.
- `storageState` 파일은 민감하므로 repository에 커밋하지 않는다.

## DB/RLS checks

- `auth.users` 생성 확인
- `app_user` 자동 생성 확인
- `app_user.auth_user_id = auth.users.id` 확인
- `user_preference.user_id = app_user.id` 확인
- 로그인 사용자가 자기 preference만 조회/수정 가능한지 확인

## Prohibited during testing

- production DB에서 테스트하지 않음
- `service_role` key 사용하지 않음
- RLS disable 금지
- 실제 사용자 개인정보 출력 금지
- secret 값 출력 금지
