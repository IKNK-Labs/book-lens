# AGENTS.md

이 문서는 Codex, GitHub Copilot 및 유사한 AI 에이전트가 이 repository에서 작업할 때 따라야 하는 기준 규칙이다.

## 문서 우선순위와 참조

- 이 repo에서는 Auth/DB 작업 전 `docs/CONTEXT.md`와 `docs/TESTING.md`를 먼저 읽는다.
- `AGENTS.md`는 규칙의 기준이다.
- `docs/CONTEXT.md`는 현재 작업 맥락이다.
- `docs/TESTING.md`는 테스트 절차다.

## Auth/DB 작업 규칙

- 실제 Supabase schema에 없는 컬럼을 임의로 추가하지 않는다.
- DB migration, RLS 정책 변경, schema 변경은 명시 승인 없이 하지 않는다.
- `service_role` key, admin DB 계정, production DB를 사용하지 않는다.
- RLS를 끄거나 우회하지 않는다.
- secret, token, DB password, `service_role` key를 출력하거나 커밋하지 않는다.
- mock 데이터와 실제 Supabase 연동을 구분한다.

## 테스트와 보고

- Auth/settings/protected route 변경 후에는 build와 관련 브라우저 테스트를 수행한다.
- 테스트하지 않은 내용을 테스트했다고 보고하지 않는다.
