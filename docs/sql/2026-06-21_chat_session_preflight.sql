-- BookLens chat session schema preflight checks.
-- Run this in the dev Supabase SQL Editor before applying
-- 2026-06-21_chat_session.sql.
--
-- This file only reads schema/catalog metadata.
-- Do not add application row queries or user/message field queries.

select current_user;

select
  has_schema_privilege(current_user, 'public', 'CREATE') as can_create_in_public;

select
  c.relname,
  pg_get_userbyid(c.relowner) as table_owner,
  current_user = pg_get_userbyid(c.relowner) as is_current_user_owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('conversation_log', 'app_user', 'character', 'book');

select to_regclass('public.chat_session') as chat_session_regclass;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'conversation_log'
  and column_name in ('session_id', 'turn_index')
order by ordinal_position;

select to_regprocedure('public.set_updated_at()') as set_updated_at_regprocedure;
