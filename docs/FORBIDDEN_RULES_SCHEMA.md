# forbidden_rules external table schema

`forbidden_rules`는 Django migration으로 생성하지 않는 unmanaged external table입니다. 환경을 준비할 때 아래 SQL을 Supabase/PostgreSQL 관리 콘솔에서 별도로 적용하세요. 이 repository 작업 중에는 실제 DB schema, RLS, grant를 변경하지 않습니다.

## 최소 schema 예시

```sql
create table if not exists public.forbidden_rules (
  id uuid primary key default gen_random_uuid(),
  pattern text not null,
  rule_type varchar(20) not null,
  description text,
  severity varchar(20) not null default 'warn',
  target varchar(20) not null default 'both',
  category varchar(100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 권장 choices 제약

기존 운영 DB 정책과 충돌하지 않는 신규 환경이라면 아래 제약을 추가해 Django model choices와 맞출 수 있습니다.

```sql
alter table public.forbidden_rules
  add constraint forbidden_rules_rule_type_check
  check (rule_type in ('word', 'phrase', 'regex'));

alter table public.forbidden_rules
  add constraint forbidden_rules_severity_check
  check (severity in ('block', 'warn', 'info'));

alter table public.forbidden_rules
  add constraint forbidden_rules_target_check
  check (target in ('user_input', 'bot_output', 'both'));
```

## table missing 동작

테이블이 없으면 `/api/admin/forbidden-rules`는 DB traceback을 노출하지 않고 503을 반환합니다. 관리자 UI는 이 503을 테이블 미설정 안내로 표시합니다.
