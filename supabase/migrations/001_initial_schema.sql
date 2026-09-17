-- ============================================================
-- ShipPulse — Migration 001: Initial Schema
-- ALL tables prefixed with shippulse_
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- shippulse_users (extends auth.users)
-- ============================================================
CREATE TABLE public.shippulse_users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  name         TEXT,
  avatar_url   TEXT,
  github_login TEXT,
  github_id    BIGINT UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_sp_users_github_id ON public.shippulse_users(github_id);
CREATE INDEX idx_sp_users_email    ON public.shippulse_users(email);

-- ============================================================
-- shippulse_workspaces
-- ============================================================
CREATE TABLE public.shippulse_workspaces (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                      TEXT NOT NULL,
  slug                      TEXT NOT NULL UNIQUE,
  logo_url                  TEXT,
  created_by                UUID NOT NULL REFERENCES public.shippulse_users(id),
  plan                      TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','team')),
  plan_limits               JSONB NOT NULL DEFAULT '{}',
  billing_customer_id       TEXT,
  billing_subscription_id   TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ
);

CREATE INDEX idx_sp_workspaces_slug       ON public.shippulse_workspaces(slug);
CREATE INDEX idx_sp_workspaces_created_by ON public.shippulse_workspaces(created_by);

-- ============================================================
-- shippulse_memberships
-- ============================================================
CREATE TABLE public.shippulse_memberships (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.shippulse_users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
  invited_by   UUID REFERENCES public.shippulse_users(id),
  invited_at   TIMESTAMPTZ,
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX idx_sp_memberships_workspace_id ON public.shippulse_memberships(workspace_id);
CREATE INDEX idx_sp_memberships_user_id      ON public.shippulse_memberships(user_id);

-- ============================================================
-- shippulse_invitations
-- ============================================================
CREATE TABLE public.shippulse_invitations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member','viewer')),
  token        TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by   UUID NOT NULL REFERENCES public.shippulse_users(id),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_invitations_token        ON public.shippulse_invitations(token);
CREATE INDEX idx_sp_invitations_email        ON public.shippulse_invitations(email);
CREATE INDEX idx_sp_invitations_workspace_id ON public.shippulse_invitations(workspace_id);

-- ============================================================
-- shippulse_projects
-- ============================================================
CREATE TABLE public.shippulse_projects (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id           UUID NOT NULL REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  slug                   TEXT NOT NULL,
  description            TEXT,
  logo_url               TEXT,
  favicon_url            TEXT,
  website_url            TEXT,
  default_language       TEXT NOT NULL DEFAULT 'en',
  timezone               TEXT NOT NULL DEFAULT 'UTC',
  -- Branding
  brand_accent_color     TEXT NOT NULL DEFAULT '#635BFF',
  brand_background       TEXT NOT NULL DEFAULT '#FFFFFF',
  brand_text_color       TEXT NOT NULL DEFAULT '#0B0D12',
  brand_font             TEXT NOT NULL DEFAULT 'Inter',
  -- Changelog settings
  changelog_theme        TEXT NOT NULL DEFAULT 'light' CHECK (changelog_theme IN ('light','dark','system')),
  changelog_layout       TEXT NOT NULL DEFAULT 'timeline',
  is_public              BOOLEAN NOT NULL DEFAULT true,
  show_subscribe         BOOLEAN NOT NULL DEFAULT true,
  show_search            BOOLEAN NOT NULL DEFAULT true,
  show_categories        BOOLEAN NOT NULL DEFAULT true,
  -- Search-engine visibility
  search_visibility      TEXT NOT NULL DEFAULT 'public_indexable'
                         CHECK (search_visibility IN ('public_indexable','public_noindex','private')),
  -- AI settings
  ai_tone                TEXT NOT NULL DEFAULT 'professional',
  ai_length              TEXT NOT NULL DEFAULT 'medium' CHECK (ai_length IN ('short','medium','long')),
  ai_technical_depth     TEXT NOT NULL DEFAULT 'customer'
                         CHECK (ai_technical_depth IN ('customer','developer','technical','stakeholder','internal')),
  ai_language            TEXT NOT NULL DEFAULT 'en',
  ai_use_emojis          BOOLEAN NOT NULL DEFAULT false,
  ai_custom_instructions TEXT,
  -- Widget defaults
  widget_enabled         BOOLEAN NOT NULL DEFAULT true,
  widget_mode            TEXT NOT NULL DEFAULT 'floating'
                         CHECK (widget_mode IN ('floating','popup','slideout','dropdown','badge','inline')),
  widget_position        TEXT NOT NULL DEFAULT 'bottom-right',
  widget_accent_color    TEXT NOT NULL DEFAULT '#635BFF',
  widget_button_text     TEXT NOT NULL DEFAULT 'What''s New',
  -- Auto-publish
  auto_publish_enabled   BOOLEAN NOT NULL DEFAULT false,
  auto_publish_config    JSONB NOT NULL DEFAULT '{}',
  -- Default template
  default_template       JSONB NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,
  UNIQUE (workspace_id, slug)
);

CREATE INDEX idx_sp_projects_workspace_id ON public.shippulse_projects(workspace_id);
CREATE INDEX idx_sp_projects_slug         ON public.shippulse_projects(slug);
CREATE INDEX idx_sp_projects_is_public    ON public.shippulse_projects(is_public) WHERE deleted_at IS NULL;

-- ============================================================
-- shippulse_domains
-- ============================================================
CREATE TABLE public.shippulse_domains (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  domain      TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verifying','active','failed')),
  verified_at TIMESTAMPTZ,
  ssl_status  TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.shippulse_domain_verifications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id      UUID NOT NULL REFERENCES public.shippulse_domains(id) ON DELETE CASCADE,
  type           TEXT NOT NULL DEFAULT 'cname',
  expected_value TEXT NOT NULL,
  verified       BOOLEAN NOT NULL DEFAULT false,
  checked_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_domains_project_id ON public.shippulse_domains(project_id);
CREATE INDEX idx_sp_domains_domain     ON public.shippulse_domains(domain);

-- ============================================================
-- shippulse_repositories
-- ============================================================
CREATE TABLE public.shippulse_repositories (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id   UUID NOT NULL REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  github_repo_id BIGINT NOT NULL,
  full_name      TEXT NOT NULL,
  name           TEXT NOT NULL,
  owner          TEXT NOT NULL,
  description    TEXT,
  url            TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  is_private     BOOLEAN NOT NULL DEFAULT false,
  is_fork        BOOLEAN NOT NULL DEFAULT false,
  language       TEXT,
  stars_count    INTEGER NOT NULL DEFAULT 0,
  forks_count    INTEGER NOT NULL DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  sync_status    TEXT NOT NULL DEFAULT 'idle' CHECK (sync_status IN ('idle','queued','syncing','completed','failed')),
  sync_error     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,
  UNIQUE (workspace_id, github_repo_id)
);

CREATE INDEX idx_sp_repositories_workspace_id   ON public.shippulse_repositories(workspace_id);
CREATE INDEX idx_sp_repositories_github_repo_id ON public.shippulse_repositories(github_repo_id);

-- ============================================================
-- shippulse_repository_connections  (project ↔ repository)
-- ============================================================
CREATE TABLE public.shippulse_repository_connections (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id         UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  repository_id      UUID NOT NULL REFERENCES public.shippulse_repositories(id) ON DELETE CASCADE,
  branch             TEXT NOT NULL DEFAULT 'main',
  path_filter        TEXT,
  tag_pattern        TEXT DEFAULT 'v*',
  release_detection  TEXT NOT NULL DEFAULT 'tags'
                     CHECK (release_detection IN ('tags','github_releases','merged_prs','branch')),
  webhook_id         BIGINT,
  webhook_secret     TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, repository_id)
);

CREATE INDEX idx_sp_repo_conn_project_id    ON public.shippulse_repository_connections(project_id);
CREATE INDEX idx_sp_repo_conn_repository_id ON public.shippulse_repository_connections(repository_id);

-- ============================================================
-- shippulse_github_tokens  (per workspace OAuth token)
-- ============================================================
CREATE TABLE public.shippulse_github_tokens (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id   UUID NOT NULL REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.shippulse_users(id) ON DELETE CASCADE,
  access_token   TEXT NOT NULL,          -- store encrypted in prod
  token_type     TEXT NOT NULL DEFAULT 'bearer',
  scope          TEXT,
  github_user_id BIGINT,
  github_login   TEXT,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id)
);

CREATE INDEX idx_sp_github_tokens_workspace_id ON public.shippulse_github_tokens(workspace_id);

-- ============================================================
-- shippulse_commits
-- ============================================================
CREATE TABLE public.shippulse_commits (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id  UUID NOT NULL REFERENCES public.shippulse_repositories(id) ON DELETE CASCADE,
  sha            TEXT NOT NULL,
  message        TEXT NOT NULL,
  author_name    TEXT,
  author_email   TEXT,
  author_date    TIMESTAMPTZ,
  committer_date TIMESTAMPTZ,
  url            TEXT,
  additions      INTEGER NOT NULL DEFAULT 0,
  deletions      INTEGER NOT NULL DEFAULT 0,
  changed_files  INTEGER NOT NULL DEFAULT 0,
  is_merge       BOOLEAN NOT NULL DEFAULT false,
  branch         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (repository_id, sha)
);

CREATE INDEX idx_sp_commits_repository_id ON public.shippulse_commits(repository_id);
CREATE INDEX idx_sp_commits_author_date   ON public.shippulse_commits(author_date DESC);
CREATE INDEX idx_sp_commits_sha           ON public.shippulse_commits(sha);

-- ============================================================
-- shippulse_pull_requests
-- ============================================================
CREATE TABLE public.shippulse_pull_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id  UUID NOT NULL REFERENCES public.shippulse_repositories(id) ON DELETE CASCADE,
  github_pr_id   BIGINT NOT NULL,
  number         INTEGER NOT NULL,
  title          TEXT NOT NULL,
  body           TEXT,
  state          TEXT NOT NULL CHECK (state IN ('open','closed','merged')),
  url            TEXT,
  author_login   TEXT,
  base_branch    TEXT,
  head_branch    TEXT,
  merged_at      TIMESTAMPTZ,
  closed_at      TIMESTAMPTZ,
  labels         JSONB NOT NULL DEFAULT '[]',
  additions      INTEGER NOT NULL DEFAULT 0,
  deletions      INTEGER NOT NULL DEFAULT 0,
  changed_files  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (repository_id, github_pr_id)
);

CREATE INDEX idx_sp_prs_repository_id ON public.shippulse_pull_requests(repository_id);
CREATE INDEX idx_sp_prs_merged_at     ON public.shippulse_pull_requests(merged_at DESC);
CREATE INDEX idx_sp_prs_state         ON public.shippulse_pull_requests(state);

-- ============================================================
-- shippulse_tags
-- ============================================================
CREATE TABLE public.shippulse_tags (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID NOT NULL REFERENCES public.shippulse_repositories(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  sha           TEXT,
  url           TEXT,
  message       TEXT,
  tagger_name   TEXT,
  tagger_date   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (repository_id, name)
);

CREATE INDEX idx_sp_tags_repository_id ON public.shippulse_tags(repository_id);
CREATE INDEX idx_sp_tags_tagger_date   ON public.shippulse_tags(tagger_date DESC);

-- ============================================================
-- shippulse_categories
-- ============================================================
CREATE TABLE public.shippulse_categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#635BFF',
  icon       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.shippulse_categories (name, slug, label, color, icon, sort_order) VALUES
  ('New',         'new',         'New',         '#635BFF', 'sparkles',   1),
  ('Improved',    'improved',    'Improved',    '#22C55E', 'arrow-up',   2),
  ('Fixed',       'fixed',       'Fixed',       '#F59E0B', 'wrench',     3),
  ('Security',    'security',    'Security',    '#EF4444', 'shield',     4),
  ('Performance', 'performance', 'Performance', '#3B82F6', 'zap',        5),
  ('Breaking',    'breaking',    'Breaking',    '#EF4444', 'alert-triangle', 6),
  ('Removed',     'removed',     'Removed',     '#6B7280', 'trash-2',    7),
  ('Other',       'other',       'Other',       '#9CA3AF', 'more-horizontal', 8);

-- ============================================================
-- shippulse_ai_jobs
-- ============================================================
CREATE TABLE public.shippulse_ai_jobs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN (
                  'generate_release','rewrite','translate',
                  'social','email','short','expand','simplify')),
  status        TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
                  'queued','processing','completed','failed','retrying','cancelled')),
  priority      INTEGER NOT NULL DEFAULT 5,
  input         JSONB NOT NULL DEFAULT '{}',
  output        JSONB,
  error         TEXT,
  retry_count   INTEGER NOT NULL DEFAULT 0,
  max_retries   INTEGER NOT NULL DEFAULT 3,
  provider      TEXT,
  model         TEXT,
  tokens_input  INTEGER,
  tokens_output INTEGER,
  latency_ms    INTEGER,
  used_fallback BOOLEAN NOT NULL DEFAULT false,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_ai_jobs_project_id  ON public.shippulse_ai_jobs(project_id);
CREATE INDEX idx_sp_ai_jobs_status      ON public.shippulse_ai_jobs(status);
CREATE INDEX idx_sp_ai_jobs_created_at  ON public.shippulse_ai_jobs(created_at DESC);

-- ============================================================
-- shippulse_ai_usage
-- ============================================================
CREATE TABLE public.shippulse_ai_usage (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES public.shippulse_projects(id) ON DELETE SET NULL,
  ai_job_id       UUID REFERENCES public.shippulse_ai_jobs(id) ON DELETE SET NULL,
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  type            TEXT NOT NULL,
  tokens_input    INTEGER NOT NULL DEFAULT 0,
  tokens_output   INTEGER NOT NULL DEFAULT 0,
  tokens_total    INTEGER NOT NULL DEFAULT 0,
  latency_ms      INTEGER,
  success         BOOLEAN NOT NULL DEFAULT true,
  error           TEXT,
  used_fallback   BOOLEAN NOT NULL DEFAULT false,
  fallback_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_ai_usage_workspace_id ON public.shippulse_ai_usage(workspace_id);
CREATE INDEX idx_sp_ai_usage_created_at   ON public.shippulse_ai_usage(created_at DESC);

-- ============================================================
-- shippulse_releases
-- ============================================================
CREATE TABLE public.shippulse_releases (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id       UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  workspace_id     UUID NOT NULL REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  ai_job_id        UUID REFERENCES public.shippulse_ai_jobs(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL,
  summary          TEXT,
  content          TEXT,
  content_html     TEXT,
  version          TEXT,
  category_id      UUID REFERENCES public.shippulse_categories(id),
  cover_image_url  TEXT,
  is_ai_generated  BOOLEAN NOT NULL DEFAULT false,
  output_mode      TEXT NOT NULL DEFAULT 'customer' CHECK (output_mode IN (
                     'customer','developer','technical','stakeholder',
                     'internal','social','email','short','long')),
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                     'generated','draft','in_review','scheduled',
                     'published','unpublished','archived')),
  published_at     TIMESTAMPTZ,
  scheduled_at     TIMESTAMPTZ,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  cta_text         TEXT,
  cta_url          TEXT,
  links            JSONB NOT NULL DEFAULT '[]',
  media            JSONB NOT NULL DEFAULT '[]',
  -- SEO
  seo_title        TEXT,
  seo_description  TEXT,
  og_image_url     TEXT,
  -- Social
  social_x         TEXT,
  social_linkedin  TEXT,
  social_facebook  TEXT,
  -- Email
  email_subject    TEXT,
  email_body       TEXT,
  -- Denormalized counters
  views_count      INTEGER NOT NULL DEFAULT 0,
  reactions_count  INTEGER NOT NULL DEFAULT 0,
  feedback_count   INTEGER NOT NULL DEFAULT 0,
  created_by       UUID REFERENCES public.shippulse_users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  UNIQUE (project_id, slug)
);

CREATE INDEX idx_sp_releases_project_id   ON public.shippulse_releases(project_id);
CREATE INDEX idx_sp_releases_workspace_id ON public.shippulse_releases(workspace_id);
CREATE INDEX idx_sp_releases_status       ON public.shippulse_releases(status);
CREATE INDEX idx_sp_releases_published_at ON public.shippulse_releases(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_sp_releases_scheduled_at ON public.shippulse_releases(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_sp_releases_fts ON public.shippulse_releases
  USING gin(to_tsvector('english',
    coalesce(title,'') || ' ' ||
    coalesce(summary,'') || ' ' ||
    coalesce(content,'')
  ));

-- ============================================================
-- shippulse_release_entries
-- ============================================================
CREATE TABLE public.shippulse_release_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  release_id      UUID NOT NULL REFERENCES public.shippulse_releases(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES public.shippulse_categories(id),
  title           TEXT NOT NULL,
  description     TEXT,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_release_entries_release_id ON public.shippulse_release_entries(release_id);
CREATE INDEX idx_sp_release_entries_project_id ON public.shippulse_release_entries(project_id);

-- ============================================================
-- shippulse_release_sources  (commit/PR/tag provenance)
-- ============================================================
CREATE TABLE public.shippulse_release_sources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  release_id  UUID NOT NULL REFERENCES public.shippulse_releases(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('commit','pull_request','tag','github_release','manual')),
  source_id   UUID,
  source_ref  TEXT,
  title       TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_release_sources_release_id ON public.shippulse_release_sources(release_id);

-- ============================================================
-- shippulse_sync_jobs
-- ============================================================
CREATE TABLE public.shippulse_sync_jobs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id     UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  repository_id  UUID NOT NULL REFERENCES public.shippulse_repositories(id) ON DELETE CASCADE,
  workspace_id   UUID NOT NULL REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','syncing','processing','completed','failed')),
  triggered_by   TEXT NOT NULL DEFAULT 'manual' CHECK (triggered_by IN ('manual','webhook','schedule','initial')),
  commits_synced INTEGER NOT NULL DEFAULT 0,
  prs_synced     INTEGER NOT NULL DEFAULT 0,
  tags_synced    INTEGER NOT NULL DEFAULT 0,
  error          TEXT,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_sync_jobs_project_id ON public.shippulse_sync_jobs(project_id);
CREATE INDEX idx_sp_sync_jobs_status     ON public.shippulse_sync_jobs(status);
CREATE INDEX idx_sp_sync_jobs_created_at ON public.shippulse_sync_jobs(created_at DESC);

-- ============================================================
-- shippulse_webhook_events_incoming  (GitHub → ShipPulse, idempotency)
-- ============================================================
CREATE TABLE public.shippulse_webhook_events_incoming (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id     TEXT NOT NULL UNIQUE,   -- X-GitHub-Delivery header
  event_type      TEXT NOT NULL,
  repository_id   UUID REFERENCES public.shippulse_repositories(id) ON DELETE SET NULL,
  payload         JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  processed       BOOLEAN NOT NULL DEFAULT false,
  processed_at    TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_wh_in_delivery_id ON public.shippulse_webhook_events_incoming(delivery_id);
CREATE INDEX idx_sp_wh_in_processed   ON public.shippulse_webhook_events_incoming(processed);

-- ============================================================
-- shippulse_webhook_endpoints  (ShipPulse → customer)
-- ============================================================
CREATE TABLE public.shippulse_webhook_endpoints (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  secret      TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events      TEXT[] NOT NULL DEFAULT '{release.published,release.updated}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.shippulse_webhook_deliveries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint_id    UUID NOT NULL REFERENCES public.shippulse_webhook_endpoints(id) ON DELETE CASCADE,
  event_type     TEXT NOT NULL,
  payload        JSONB NOT NULL,
  status_code    INTEGER,
  response_body  TEXT,
  attempt_count  INTEGER NOT NULL DEFAULT 1,
  next_retry_at  TIMESTAMPTZ,
  delivered_at   TIMESTAMPTZ,
  failed_at      TIMESTAMPTZ,
  error          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_wh_endpoints_project_id   ON public.shippulse_webhook_endpoints(project_id);
CREATE INDEX idx_sp_wh_deliveries_endpoint_id ON public.shippulse_webhook_deliveries(endpoint_id);
CREATE INDEX idx_sp_wh_deliveries_next_retry  ON public.shippulse_webhook_deliveries(next_retry_at)
  WHERE next_retry_at IS NOT NULL;

-- ============================================================
-- shippulse_widgets
-- ============================================================
CREATE TABLE public.shippulse_widgets (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id              UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL DEFAULT 'Default Widget',
  mode                    TEXT NOT NULL DEFAULT 'floating'
                          CHECK (mode IN ('floating','popup','slideout','dropdown','badge','inline')),
  position                TEXT NOT NULL DEFAULT 'bottom-right',
  theme                   TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light','dark','system')),
  accent_color            TEXT NOT NULL DEFAULT '#635BFF',
  badge_color             TEXT NOT NULL DEFAULT '#EF4444',
  badge_position          TEXT NOT NULL DEFAULT 'top-right',
  button_text             TEXT NOT NULL DEFAULT 'What''s New',
  entry_count             INTEGER NOT NULL DEFAULT 10,
  show_dates              BOOLEAN NOT NULL DEFAULT true,
  show_categories         BOOLEAN NOT NULL DEFAULT true,
  show_reactions          BOOLEAN NOT NULL DEFAULT true,
  animation               TEXT NOT NULL DEFAULT 'slide',
  categories              TEXT[] DEFAULT NULL,
  custom_trigger_selector TEXT,
  custom_css              TEXT,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_widgets_project_id ON public.shippulse_widgets(project_id);

-- ============================================================
-- shippulse_widget_visitors
-- ============================================================
CREATE TABLE public.shippulse_widget_visitors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  visitor_hash  TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, visitor_hash)
);

CREATE INDEX idx_sp_widget_visitors_project_id ON public.shippulse_widget_visitors(project_id);

-- ============================================================
-- shippulse_widget_events
-- ============================================================
CREATE TABLE public.shippulse_widget_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  widget_id    UUID REFERENCES public.shippulse_widgets(id) ON DELETE SET NULL,
  release_id   UUID REFERENCES public.shippulse_releases(id) ON DELETE SET NULL,
  visitor_hash TEXT,
  event_type   TEXT NOT NULL CHECK (event_type IN ('impression','open','close','seen','click','feedback')),
  metadata     JSONB NOT NULL DEFAULT '{}',
  session_id   TEXT,
  referrer     TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_widget_events_project_id  ON public.shippulse_widget_events(project_id);
CREATE INDEX idx_sp_widget_events_release_id  ON public.shippulse_widget_events(release_id);
CREATE INDEX idx_sp_widget_events_created_at  ON public.shippulse_widget_events(created_at DESC);
CREATE INDEX idx_sp_widget_events_event_type  ON public.shippulse_widget_events(event_type);

-- ============================================================
-- shippulse_changelog_views
-- ============================================================
CREATE TABLE public.shippulse_changelog_views (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  release_id   UUID REFERENCES public.shippulse_releases(id) ON DELETE SET NULL,
  visitor_hash TEXT,
  referrer     TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_changelog_views_project_id ON public.shippulse_changelog_views(project_id);
CREATE INDEX idx_sp_changelog_views_release_id ON public.shippulse_changelog_views(release_id);
CREATE INDEX idx_sp_changelog_views_created_at ON public.shippulse_changelog_views(created_at DESC);

-- ============================================================
-- shippulse_feedback
-- ============================================================
CREATE TABLE public.shippulse_feedback (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  release_id   UUID NOT NULL REFERENCES public.shippulse_releases(id) ON DELETE CASCADE,
  visitor_hash TEXT,
  user_id      UUID REFERENCES public.shippulse_users(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN ('helpful','not_helpful','reaction','comment','submission')),
  reaction     TEXT,
  content      TEXT,
  is_spam      BOOLEAN NOT NULL DEFAULT false,
  is_approved  BOOLEAN NOT NULL DEFAULT true,
  ip_hash      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_feedback_project_id  ON public.shippulse_feedback(project_id);
CREATE INDEX idx_sp_feedback_release_id  ON public.shippulse_feedback(release_id);
CREATE INDEX idx_sp_feedback_created_at  ON public.shippulse_feedback(created_at DESC);

CREATE TABLE public.shippulse_feedback_comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL REFERENCES public.shippulse_feedback(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.shippulse_users(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  is_spam     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_feedback_comments_feedback_id ON public.shippulse_feedback_comments(feedback_id);

-- ============================================================
-- shippulse_subscribers
-- ============================================================
CREATE TABLE public.shippulse_subscribers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  name            TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','unsubscribed','bounced')),
  confirm_token   TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  confirmed_at    TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  preferences     JSONB NOT NULL DEFAULT '{"categories":[],"frequency":"instant"}',
  source          TEXT NOT NULL DEFAULT 'changelog',
  ip_hash         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, email)
);

CREATE INDEX idx_sp_subscribers_project_id    ON public.shippulse_subscribers(project_id);
CREATE INDEX idx_sp_subscribers_status        ON public.shippulse_subscribers(status);
CREATE INDEX idx_sp_subscribers_confirm_token ON public.shippulse_subscribers(confirm_token);

-- ============================================================
-- shippulse_integrations
-- ============================================================
CREATE TABLE public.shippulse_integrations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('slack','discord','email','github_release','rss','webhook')),
  name         TEXT NOT NULL,
  config       JSONB NOT NULL DEFAULT '{}',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_integrations_project_id ON public.shippulse_integrations(project_id);
CREATE INDEX idx_sp_integrations_type       ON public.shippulse_integrations(type);

-- ============================================================
-- shippulse_api_keys
-- ============================================================
CREATE TABLE public.shippulse_api_keys (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  key_hash     TEXT NOT NULL UNIQUE,
  key_prefix   TEXT NOT NULL,
  scopes       TEXT[] NOT NULL DEFAULT '{read}',
  last_used_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  created_by   UUID REFERENCES public.shippulse_users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_api_keys_workspace_id ON public.shippulse_api_keys(workspace_id);
CREATE INDEX idx_sp_api_keys_key_hash     ON public.shippulse_api_keys(key_hash);
CREATE INDEX idx_sp_api_keys_key_prefix   ON public.shippulse_api_keys(key_prefix);

-- ============================================================
-- shippulse_audit_logs
-- ============================================================
CREATE TABLE public.shippulse_audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID REFERENCES public.shippulse_workspaces(id) ON DELETE SET NULL,
  project_id    UUID REFERENCES public.shippulse_projects(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES public.shippulse_users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   UUID,
  metadata      JSONB NOT NULL DEFAULT '{}',
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_audit_logs_workspace_id ON public.shippulse_audit_logs(workspace_id);
CREATE INDEX idx_sp_audit_logs_project_id   ON public.shippulse_audit_logs(project_id);
CREATE INDEX idx_sp_audit_logs_user_id      ON public.shippulse_audit_logs(user_id);
CREATE INDEX idx_sp_audit_logs_action       ON public.shippulse_audit_logs(action);
CREATE INDEX idx_sp_audit_logs_created_at   ON public.shippulse_audit_logs(created_at DESC);

-- ============================================================
-- shippulse_notifications
-- ============================================================
CREATE TABLE public.shippulse_notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.shippulse_users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  data         JSONB NOT NULL DEFAULT '{}',
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_notifications_user_id  ON public.shippulse_notifications(user_id);
CREATE INDEX idx_sp_notifications_unread   ON public.shippulse_notifications(read_at) WHERE read_at IS NULL;

CREATE TABLE public.shippulse_notification_preferences (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.shippulse_users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.shippulse_workspaces(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL CHECK (channel IN ('email','in_app')),
  event_type   TEXT NOT NULL,
  enabled      BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (user_id, workspace_id, channel, event_type)
);

-- ============================================================
-- shippulse_release_templates
-- ============================================================
CREATE TABLE public.shippulse_release_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.shippulse_projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  template    JSONB NOT NULL DEFAULT '{}',
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_release_templates_project_id ON public.shippulse_release_templates(project_id);

-- ============================================================
-- shippulse_user_sessions
-- ============================================================
CREATE TABLE public.shippulse_user_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.shippulse_users(id) ON DELETE CASCADE,
  ip_address  TEXT,
  user_agent  TEXT,
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_user_sessions_user_id ON public.shippulse_user_sessions(user_id);

-- ============================================================
-- shippulse_rate_limit_log
-- ============================================================
CREATE TABLE public.shippulse_rate_limit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier   TEXT NOT NULL,
  endpoint     TEXT NOT NULL,
  count        INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sp_rate_limit ON public.shippulse_rate_limit_log(identifier, endpoint, window_start);

-- ============================================================
-- updated_at trigger (applied to all tables)
-- ============================================================
CREATE OR REPLACE FUNCTION shippulse_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'shippulse_users',
    'shippulse_workspaces',
    'shippulse_memberships',
    'shippulse_invitations',
    'shippulse_projects',
    'shippulse_domains',
    'shippulse_domain_verifications',
    'shippulse_repositories',
    'shippulse_repository_connections',
    'shippulse_github_tokens',
    'shippulse_pull_requests',
    'shippulse_releases',
    'shippulse_release_entries',
    'shippulse_ai_jobs',
    'shippulse_sync_jobs',
    'shippulse_webhook_endpoints',
    'shippulse_webhook_deliveries',
    'shippulse_widgets',
    'shippulse_feedback',
    'shippulse_feedback_comments',
    'shippulse_subscribers',
    'shippulse_integrations',
    'shippulse_notification_preferences',
    'shippulse_release_templates'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_sp_updated_at_%s
       BEFORE UPDATE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION shippulse_set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;
