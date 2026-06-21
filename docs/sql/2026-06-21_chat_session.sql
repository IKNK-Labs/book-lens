-- BookLens chat session MVP schema package.
-- Target: dev Supabase only.
--
-- Apply manually after reviewing and running
-- 2026-06-21_chat_session_preflight.sql.
--
-- Scope:
-- - Create public.chat_session.
-- - Add nullable session columns to public.conversation_log.
-- - Add indexes for session list and transcript reads.
-- - Enable RLS and add own select/insert/update policies for chat_session.
-- - Grant select/insert/update on chat_session to authenticated.
-- - Add updated_at trigger using public.set_updated_at().
--
-- Out of scope:
-- - No conversation_message table.
-- - No conversation_summary or memory/embedding tables.
-- - No conversation_log policy drop/alter.
-- - No row backfill for existing conversation_log rows.
-- - No delete policy for chat_session.
--
-- Before applying the trigger section, confirm that
-- public.set_updated_at() exists and its signature matches this trigger call.
-- If the function is missing or incompatible, stop before creating the trigger.

begin;

create table public.chat_session (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public.app_user(id) on delete cascade,
  character_id bigint not null references public."character"(id) on delete cascade,
  book_id bigint not null references public.book(id) on delete cascade,
  title varchar(120) null,
  last_message_preview text null,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.chat_session is
  'Chat session container for BookLens character conversations.';
comment on column public.chat_session.book_id is
  'MVP note: character_id/book_id consistency is enforced by the API, not a DB-level composite constraint.';

alter table public.conversation_log
  add column session_id uuid null references public.chat_session(id) on delete cascade,
  add column turn_index integer null;

create index idx_chat_session_user_last_active
  on public.chat_session (user_id, last_active_at desc);

create index idx_chat_session_user_character
  on public.chat_session (user_id, character_id);

create index idx_chat_session_book_id
  on public.chat_session (book_id);

create index idx_chat_session_character_id
  on public.chat_session (character_id);

create index idx_conversation_log_session_turn
  on public.conversation_log (session_id, turn_index);

create index idx_conversation_log_session_created_id
  on public.conversation_log (session_id, created_at, id);

create unique index conversation_log_session_turn_unique
  on public.conversation_log (session_id, turn_index)
  where session_id is not null
    and turn_index is not null;

alter table public.chat_session enable row level security;

create policy "read own chat_session"
  on public.chat_session
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.app_user
      where app_user.id = chat_session.user_id
        and app_user.auth_user_id = (select auth.uid())
    )
  );

create policy "insert own chat_session"
  on public.chat_session
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.app_user
      where app_user.id = chat_session.user_id
        and app_user.auth_user_id = (select auth.uid())
    )
  );

create policy "update own chat_session"
  on public.chat_session
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.app_user
      where app_user.id = chat_session.user_id
        and app_user.auth_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.app_user
      where app_user.id = chat_session.user_id
        and app_user.auth_user_id = (select auth.uid())
    )
  );

grant select, insert, update on public.chat_session to authenticated;

create trigger set_chat_session_updated_at
  before update on public.chat_session
  for each row
  execute function public.set_updated_at();

commit;

-- 후속 검토: conversation_log.session_id 소유권 검증 policy
--
-- 기본 적용 SQL에서는 기존 public.conversation_log policy를 drop/alter하지 않는다.
-- 현재 확인된 기존 policy는 user_id 소유 여부 중심이다.
-- session_id가 추가되면 INSERT 시 해당 session_id가 같은 user 소유인지
-- 검증하는 RLS 보강이 필요할 수 있다.
--
-- 다만 현재 backend chat API는 Supabase JWT/RLS 기반 구조가 아니며,
-- RLS 기반 API 구현 가능 여부가 보류 상태다.
-- 따라서 conversation_log RLS 강화는 후속 인증/RLS 설계 작업에서 검토한다.
