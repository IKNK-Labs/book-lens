# GitHub Copilot Instructions

- Follow `AGENTS.md`.
- For auth/session/settings changes, consult `docs/CONTEXT.md` and `docs/TESTING.md`.
- Do not add schema fields that are not in the actual Supabase schema.
- Do not use `service_role` keys.
- Do not bypass RLS.
- Do not commit secrets.
- Require build and relevant browser/API tests for auth/settings/protected route changes.
