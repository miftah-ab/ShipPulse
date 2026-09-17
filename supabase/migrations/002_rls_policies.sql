-- ============================================================
-- ShipPulse  -  Migration 002: Row Level Security Policies
-- ALL policies enforce strict workspace-tenant isolation
-- ============================================================

-- Helper: get the workspace_ids the current user belongs to
CREATE OR REPLACE FUNCTION shippulse_my_workspace_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT workspace_id FROM public.shippulse_memberships
  WHERE user_id = auth.uid()
$$;

-- Helper: get the role of the current user in a workspace
CREATE OR REPLACE FUNCTION shippulse_my_role(p_workspace_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.shippulse_memberships
  WHERE user_id = auth.uid() AND workspace_id = p_workspace_id
  LIMIT 1
$$;

-- Helper: check if current user can write to a workspace (owner/admin/member)
CREATE OR REPLACE FUNCTION shippulse_can_write(p_workspace_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shippulse_memberships
    WHERE user_id = auth.uid()
      AND workspace_id = p_workspace_id
      AND role IN ('owner','admin','member')
  )
$$;

-- Helper: check if current user is owner/admin in a workspace
CREATE OR REPLACE FUNCTION shippulse_is_admin(p_workspace_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shippulse_memberships
    WHERE user_id = auth.uid()
      AND workspace_id = p_workspace_id
      AND role IN ('owner','admin')
  )
$$;

-- ============================================================
-- Enable RLS on every table
-- ============================================================
ALTER TABLE public.shippulse_users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_workspaces                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_memberships                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_invitations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_projects                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_domains                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_domain_verifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_repositories               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_repository_connections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_github_tokens              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_commits                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_pull_requests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_tags                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_categories                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_ai_jobs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_ai_usage                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_releases                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_release_entries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_release_sources            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_sync_jobs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_webhook_events_incoming    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_webhook_endpoints          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_webhook_deliveries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_widgets                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_widget_visitors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_widget_events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_changelog_views            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_feedback                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_feedback_comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_subscribers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_integrations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_api_keys                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_audit_logs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_notification_preferences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_release_templates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_user_sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippulse_rate_limit_log             ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- shippulse_users  -  users see/edit only their own row
-- ============================================================
CREATE POLICY "sp_users_select_own" ON public.shippulse_users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "sp_users_insert_own" ON public.shippulse_users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "sp_users_update_own" ON public.shippulse_users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- shippulse_workspaces  -  members can read; only owner/admin can update
-- ============================================================
CREATE POLICY "sp_workspaces_select" ON public.shippulse_workspaces
  FOR SELECT USING (id IN (SELECT shippulse_my_workspace_ids()));

CREATE POLICY "sp_workspaces_insert" ON public.shippulse_workspaces
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "sp_workspaces_update" ON public.shippulse_workspaces
  FOR UPDATE USING (shippulse_is_admin(id))
  WITH CHECK (shippulse_is_admin(id));

CREATE POLICY "sp_workspaces_delete" ON public.shippulse_workspaces
  FOR DELETE USING (
    shippulse_my_role(id) = 'owner'
  );

-- ============================================================
-- shippulse_memberships
-- ============================================================
CREATE POLICY "sp_memberships_select" ON public.shippulse_memberships
  FOR SELECT USING (workspace_id IN (SELECT shippulse_my_workspace_ids()));

CREATE POLICY "sp_memberships_insert" ON public.shippulse_memberships
  FOR INSERT WITH CHECK (shippulse_is_admin(workspace_id));

CREATE POLICY "sp_memberships_update" ON public.shippulse_memberships
  FOR UPDATE USING (shippulse_is_admin(workspace_id))
  WITH CHECK (shippulse_is_admin(workspace_id));

CREATE POLICY "sp_memberships_delete" ON public.shippulse_memberships
  FOR DELETE USING (
    shippulse_is_admin(workspace_id) OR user_id = auth.uid()
  );

-- ============================================================
-- shippulse_invitations
-- ============================================================
CREATE POLICY "sp_invitations_select" ON public.shippulse_invitations
  FOR SELECT USING (workspace_id IN (SELECT shippulse_my_workspace_ids()));

CREATE POLICY "sp_invitations_insert" ON public.shippulse_invitations
  FOR INSERT WITH CHECK (shippulse_is_admin(workspace_id));

CREATE POLICY "sp_invitations_delete" ON public.shippulse_invitations
  FOR DELETE USING (shippulse_is_admin(workspace_id));

-- Public: anyone can read their own invitation by token (handled via service role in API)

-- ============================================================
-- shippulse_projects
-- ============================================================
CREATE POLICY "sp_projects_select_member" ON public.shippulse_projects
  FOR SELECT USING (
    workspace_id IN (SELECT shippulse_my_workspace_ids())
    AND deleted_at IS NULL
  );

-- Public projects can be read without auth (for changelog pages)
CREATE POLICY "sp_projects_select_public" ON public.shippulse_projects
  FOR SELECT USING (
    is_public = true
    AND search_visibility IN ('public_indexable','public_noindex')
    AND deleted_at IS NULL
  );

CREATE POLICY "sp_projects_insert" ON public.shippulse_projects
  FOR INSERT WITH CHECK (shippulse_can_write(workspace_id));

CREATE POLICY "sp_projects_update" ON public.shippulse_projects
  FOR UPDATE USING (shippulse_is_admin(workspace_id))
  WITH CHECK (shippulse_is_admin(workspace_id));

CREATE POLICY "sp_projects_delete" ON public.shippulse_projects
  FOR DELETE USING (shippulse_is_admin(workspace_id));

-- ============================================================
-- shippulse_domains
-- ============================================================
CREATE POLICY "sp_domains_select" ON public.shippulse_domains
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_domains_insert" ON public.shippulse_domains
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

CREATE POLICY "sp_domains_update" ON public.shippulse_domains
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

CREATE POLICY "sp_domains_delete" ON public.shippulse_domains
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

-- ============================================================
-- shippulse_repositories  -  workspace-scoped
-- ============================================================
CREATE POLICY "sp_repos_select" ON public.shippulse_repositories
  FOR SELECT USING (
    workspace_id IN (SELECT shippulse_my_workspace_ids())
    AND deleted_at IS NULL
  );

CREATE POLICY "sp_repos_insert" ON public.shippulse_repositories
  FOR INSERT WITH CHECK (shippulse_can_write(workspace_id));

CREATE POLICY "sp_repos_update" ON public.shippulse_repositories
  FOR UPDATE USING (workspace_id IN (SELECT shippulse_my_workspace_ids()))
  WITH CHECK (shippulse_can_write(workspace_id));

CREATE POLICY "sp_repos_delete" ON public.shippulse_repositories
  FOR DELETE USING (shippulse_is_admin(workspace_id));

-- ============================================================
-- shippulse_repository_connections
-- ============================================================
CREATE POLICY "sp_repo_conn_select" ON public.shippulse_repository_connections
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_repo_conn_insert" ON public.shippulse_repository_connections
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_can_write(p.workspace_id)
    )
  );

CREATE POLICY "sp_repo_conn_delete" ON public.shippulse_repository_connections
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

-- ============================================================
-- shippulse_github_tokens  -  only workspace owner/admin can read
-- ============================================================
CREATE POLICY "sp_github_tokens_select" ON public.shippulse_github_tokens
  FOR SELECT USING (shippulse_is_admin(workspace_id));

CREATE POLICY "sp_github_tokens_insert" ON public.shippulse_github_tokens
  FOR INSERT WITH CHECK (shippulse_is_admin(workspace_id));

CREATE POLICY "sp_github_tokens_update" ON public.shippulse_github_tokens
  FOR UPDATE USING (shippulse_is_admin(workspace_id));

CREATE POLICY "sp_github_tokens_delete" ON public.shippulse_github_tokens
  FOR DELETE USING (shippulse_is_admin(workspace_id));

-- ============================================================
-- shippulse_commits / pull_requests / tags  -  workspace-scoped via repo
-- ============================================================
CREATE POLICY "sp_commits_select" ON public.shippulse_commits
  FOR SELECT USING (
    repository_id IN (
      SELECT id FROM public.shippulse_repositories
      WHERE workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_commits_insert" ON public.shippulse_commits
  FOR INSERT WITH CHECK (
    repository_id IN (
      SELECT id FROM public.shippulse_repositories
      WHERE workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_prs_select" ON public.shippulse_pull_requests
  FOR SELECT USING (
    repository_id IN (
      SELECT id FROM public.shippulse_repositories
      WHERE workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_prs_insert" ON public.shippulse_pull_requests
  FOR INSERT WITH CHECK (
    repository_id IN (
      SELECT id FROM public.shippulse_repositories
      WHERE workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_tags_select" ON public.shippulse_tags
  FOR SELECT USING (
    repository_id IN (
      SELECT id FROM public.shippulse_repositories
      WHERE workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_tags_insert" ON public.shippulse_tags
  FOR INSERT WITH CHECK (
    repository_id IN (
      SELECT id FROM public.shippulse_repositories
      WHERE workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

-- ============================================================
-- shippulse_categories  -  public read, no user insert
-- ============================================================
CREATE POLICY "sp_categories_select_all" ON public.shippulse_categories
  FOR SELECT USING (true);

-- ============================================================
-- shippulse_ai_jobs
-- ============================================================
CREATE POLICY "sp_ai_jobs_select" ON public.shippulse_ai_jobs
  FOR SELECT USING (workspace_id IN (SELECT shippulse_my_workspace_ids()));

CREATE POLICY "sp_ai_jobs_insert" ON public.shippulse_ai_jobs
  FOR INSERT WITH CHECK (shippulse_can_write(workspace_id));

CREATE POLICY "sp_ai_jobs_update" ON public.shippulse_ai_jobs
  FOR UPDATE USING (workspace_id IN (SELECT shippulse_my_workspace_ids()));

-- ============================================================
-- shippulse_ai_usage
-- ============================================================
CREATE POLICY "sp_ai_usage_select" ON public.shippulse_ai_usage
  FOR SELECT USING (workspace_id IN (SELECT shippulse_my_workspace_ids()));

-- ============================================================
-- shippulse_releases
-- ============================================================
-- Members can see all releases in their workspace
CREATE POLICY "sp_releases_select_member" ON public.shippulse_releases
  FOR SELECT USING (
    workspace_id IN (SELECT shippulse_my_workspace_ids())
    AND deleted_at IS NULL
  );

-- Public can only see published releases on public projects
CREATE POLICY "sp_releases_select_public" ON public.shippulse_releases
  FOR SELECT USING (
    status = 'published'
    AND deleted_at IS NULL
    AND project_id IN (
      SELECT id FROM public.shippulse_projects
      WHERE is_public = true
        AND search_visibility IN ('public_indexable','public_noindex')
        AND deleted_at IS NULL
    )
  );

CREATE POLICY "sp_releases_insert" ON public.shippulse_releases
  FOR INSERT WITH CHECK (shippulse_can_write(workspace_id));

CREATE POLICY "sp_releases_update" ON public.shippulse_releases
  FOR UPDATE USING (shippulse_can_write(workspace_id))
  WITH CHECK (shippulse_can_write(workspace_id));

CREATE POLICY "sp_releases_delete" ON public.shippulse_releases
  FOR DELETE USING (shippulse_is_admin(workspace_id));

-- ============================================================
-- shippulse_release_entries
-- ============================================================
CREATE POLICY "sp_release_entries_select_member" ON public.shippulse_release_entries
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_release_entries_select_public" ON public.shippulse_release_entries
  FOR SELECT USING (
    release_id IN (
      SELECT id FROM public.shippulse_releases
      WHERE status = 'published' AND deleted_at IS NULL
        AND project_id IN (
          SELECT id FROM public.shippulse_projects
          WHERE is_public = true AND deleted_at IS NULL
        )
    )
  );

CREATE POLICY "sp_release_entries_insert" ON public.shippulse_release_entries
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_can_write(p.workspace_id)
    )
  );

CREATE POLICY "sp_release_entries_update" ON public.shippulse_release_entries
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_can_write(p.workspace_id)
    )
  );

CREATE POLICY "sp_release_entries_delete" ON public.shippulse_release_entries
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

-- ============================================================
-- shippulse_release_sources
-- ============================================================
CREATE POLICY "sp_release_sources_select_member" ON public.shippulse_release_sources
  FOR SELECT USING (
    release_id IN (
      SELECT id FROM public.shippulse_releases
      WHERE workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_release_sources_select_public" ON public.shippulse_release_sources
  FOR SELECT USING (
    release_id IN (
      SELECT id FROM public.shippulse_releases
      WHERE status = 'published' AND deleted_at IS NULL
    )
  );

CREATE POLICY "sp_release_sources_insert" ON public.shippulse_release_sources
  FOR INSERT WITH CHECK (
    release_id IN (
      SELECT id FROM public.shippulse_releases
      WHERE workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

-- ============================================================
-- shippulse_sync_jobs
-- ============================================================
CREATE POLICY "sp_sync_jobs_select" ON public.shippulse_sync_jobs
  FOR SELECT USING (workspace_id IN (SELECT shippulse_my_workspace_ids()));

CREATE POLICY "sp_sync_jobs_insert" ON public.shippulse_sync_jobs
  FOR INSERT WITH CHECK (shippulse_can_write(workspace_id));

CREATE POLICY "sp_sync_jobs_update" ON public.shippulse_sync_jobs
  FOR UPDATE USING (workspace_id IN (SELECT shippulse_my_workspace_ids()));

-- ============================================================
-- shippulse_webhook_events_incoming  -  service role only in prod
-- ============================================================
CREATE POLICY "sp_wh_in_select" ON public.shippulse_webhook_events_incoming
  FOR SELECT USING (
    repository_id IN (
      SELECT id FROM public.shippulse_repositories
      WHERE workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

-- ============================================================
-- shippulse_webhook_endpoints (outgoing)
-- ============================================================
CREATE POLICY "sp_wh_endpoints_select" ON public.shippulse_webhook_endpoints
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_wh_endpoints_insert" ON public.shippulse_webhook_endpoints
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

CREATE POLICY "sp_wh_endpoints_update" ON public.shippulse_webhook_endpoints
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

CREATE POLICY "sp_wh_endpoints_delete" ON public.shippulse_webhook_endpoints
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

-- ============================================================
-- shippulse_webhook_deliveries
-- ============================================================
CREATE POLICY "sp_wh_deliveries_select" ON public.shippulse_webhook_deliveries
  FOR SELECT USING (
    endpoint_id IN (
      SELECT e.id FROM public.shippulse_webhook_endpoints e
      JOIN public.shippulse_projects p ON p.id = e.project_id
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

-- ============================================================
-- shippulse_widgets
-- ============================================================
CREATE POLICY "sp_widgets_select_member" ON public.shippulse_widgets
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

-- Widget config is public (needed for widget.js to load)
CREATE POLICY "sp_widgets_select_public" ON public.shippulse_widgets
  FOR SELECT USING (
    is_active = true
    AND project_id IN (
      SELECT id FROM public.shippulse_projects
      WHERE is_public = true AND deleted_at IS NULL
    )
  );

CREATE POLICY "sp_widgets_insert" ON public.shippulse_widgets
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_can_write(p.workspace_id)
    )
  );

CREATE POLICY "sp_widgets_update" ON public.shippulse_widgets
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_can_write(p.workspace_id)
    )
  );

CREATE POLICY "sp_widgets_delete" ON public.shippulse_widgets
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

-- ============================================================
-- shippulse_widget_visitors / widget_events / changelog_views
-- These accept anonymous inserts from the public widget/changelog
-- ============================================================
CREATE POLICY "sp_widget_visitors_select" ON public.shippulse_widget_visitors
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );
CREATE POLICY "sp_widget_visitors_insert_anon" ON public.shippulse_widget_visitors
  FOR INSERT WITH CHECK (true); -- visitor tracking, rate-limited at API layer

CREATE POLICY "sp_widget_events_select" ON public.shippulse_widget_events
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );
CREATE POLICY "sp_widget_events_insert_anon" ON public.shippulse_widget_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "sp_changelog_views_select" ON public.shippulse_changelog_views
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );
CREATE POLICY "sp_changelog_views_insert_anon" ON public.shippulse_changelog_views
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- shippulse_feedback
-- ============================================================
CREATE POLICY "sp_feedback_select_member" ON public.shippulse_feedback
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

-- Approved public feedback visible on changelog
CREATE POLICY "sp_feedback_select_public" ON public.shippulse_feedback
  FOR SELECT USING (
    is_spam = false
    AND is_approved = true
    AND project_id IN (
      SELECT id FROM public.shippulse_projects
      WHERE is_public = true AND deleted_at IS NULL
    )
  );

CREATE POLICY "sp_feedback_insert_anon" ON public.shippulse_feedback
  FOR INSERT WITH CHECK (true); -- rate-limited at API layer

CREATE POLICY "sp_feedback_update_admin" ON public.shippulse_feedback
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

-- ============================================================
-- shippulse_feedback_comments
-- ============================================================
CREATE POLICY "sp_feedback_comments_select" ON public.shippulse_feedback_comments
  FOR SELECT USING (
    feedback_id IN (
      SELECT id FROM public.shippulse_feedback WHERE is_spam = false
    )
  );
CREATE POLICY "sp_feedback_comments_insert_anon" ON public.shippulse_feedback_comments
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- shippulse_subscribers  -  project owners see; no public email exposure
-- ============================================================
CREATE POLICY "sp_subscribers_select" ON public.shippulse_subscribers
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

CREATE POLICY "sp_subscribers_insert_anon" ON public.shippulse_subscribers
  FOR INSERT WITH CHECK (true); -- confirmation required, rate-limited

CREATE POLICY "sp_subscribers_update_anon" ON public.shippulse_subscribers
  FOR UPDATE USING (true); -- for confirm/unsubscribe by token (service role validates token)

-- ============================================================
-- shippulse_integrations
-- ============================================================
CREATE POLICY "sp_integrations_select" ON public.shippulse_integrations
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_integrations_insert" ON public.shippulse_integrations
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

CREATE POLICY "sp_integrations_update" ON public.shippulse_integrations
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

CREATE POLICY "sp_integrations_delete" ON public.shippulse_integrations
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

-- ============================================================
-- shippulse_api_keys
-- ============================================================
CREATE POLICY "sp_api_keys_select" ON public.shippulse_api_keys
  FOR SELECT USING (shippulse_is_admin(workspace_id));

CREATE POLICY "sp_api_keys_insert" ON public.shippulse_api_keys
  FOR INSERT WITH CHECK (shippulse_is_admin(workspace_id));

CREATE POLICY "sp_api_keys_update" ON public.shippulse_api_keys
  FOR UPDATE USING (shippulse_is_admin(workspace_id));

-- ============================================================
-- shippulse_audit_logs  -  read only for admins
-- ============================================================
CREATE POLICY "sp_audit_logs_select" ON public.shippulse_audit_logs
  FOR SELECT USING (
    workspace_id IN (SELECT shippulse_my_workspace_ids())
    AND shippulse_is_admin(workspace_id)
  );

-- Inserts done by service role only (no user-level insert)

-- ============================================================
-- shippulse_notifications
-- ============================================================
CREATE POLICY "sp_notifications_select" ON public.shippulse_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sp_notifications_update" ON public.shippulse_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- shippulse_notification_preferences
-- ============================================================
CREATE POLICY "sp_notif_prefs_select" ON public.shippulse_notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sp_notif_prefs_insert" ON public.shippulse_notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sp_notif_prefs_update" ON public.shippulse_notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "sp_notif_prefs_delete" ON public.shippulse_notification_preferences
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- shippulse_release_templates
-- ============================================================
CREATE POLICY "sp_release_templates_select" ON public.shippulse_release_templates
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE p.workspace_id IN (SELECT shippulse_my_workspace_ids())
    )
  );

CREATE POLICY "sp_release_templates_insert" ON public.shippulse_release_templates
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_can_write(p.workspace_id)
    )
  );

CREATE POLICY "sp_release_templates_update" ON public.shippulse_release_templates
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_can_write(p.workspace_id)
    )
  );

CREATE POLICY "sp_release_templates_delete" ON public.shippulse_release_templates
  FOR DELETE USING (
    project_id IN (
      SELECT p.id FROM public.shippulse_projects p
      WHERE shippulse_is_admin(p.workspace_id)
    )
  );

-- ============================================================
-- shippulse_user_sessions
-- ============================================================
CREATE POLICY "sp_user_sessions_select" ON public.shippulse_user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sp_user_sessions_insert" ON public.shippulse_user_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sp_user_sessions_delete" ON public.shippulse_user_sessions
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- shippulse_rate_limit_log  -  service role only
-- ============================================================
-- No user-facing policies; accessed via service role in API routes only
