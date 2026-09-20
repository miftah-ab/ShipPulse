-- ============================================================
-- ShipPulse  -  Migration 003: GitHub Token Persistence
-- Store provider_token so repo discovery works beyond the
-- initial OAuth callback (Supabase does not persist it in
-- the cookie after the first exchange).
-- ============================================================

ALTER TABLE public.shippulse_users
  ADD COLUMN IF NOT EXISTS github_access_token  TEXT,
  ADD COLUMN IF NOT EXISTS github_token_scope   TEXT,
  ADD COLUMN IF NOT EXISTS github_token_updated TIMESTAMPTZ;
