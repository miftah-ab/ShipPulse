// ============================================================
// POST /api/onboarding/provision
// Atomically provisions real Workspace, Membership, and Project
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateUniqueSlug } from '@/lib/slugs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      workspaceName = 'My Workspace',
      workspaceSlug,
      projectName = 'My Project',
      projectSlug,
      repoUrl,
      repoBranch = 'main',
      initialRelease,
    } = body

    const serviceDb = createServiceClient()

    // 1. Create or find workspace
    const baseWSlug = workspaceSlug || workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const finalWSlug = `${baseWSlug}-${Date.now().toString(36)}`

    const { data: workspace, error: wErr } = await serviceDb
      .from('shippulse_workspaces')
      .insert({
        name: workspaceName,
        slug: finalWSlug,
      })
      .select()
      .single()

    if (wErr || !workspace) {
      console.error('[Provision] Workspace error:', wErr?.message)
      return NextResponse.json({ error: 'Failed to provision workspace' }, { status: 500 })
    }

    // 2. Add owner membership
    const { error: mErr } = await serviceDb
      .from('shippulse_memberships')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
      })

    if (mErr) {
      console.error('[Provision] Membership error:', mErr.message)
    }

    // 3. Create Project
    const basePSlug = projectSlug || projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const finalPSlug = `${basePSlug}-${Date.now().toString(36)}`

    const { data: project, error: pErr } = await serviceDb
      .from('shippulse_projects')
      .insert({
        workspace_id: workspace.id,
        name: projectName,
        slug: finalPSlug,
        is_public: true,
      })
      .select()
      .single()

    if (pErr || !project) {
      console.error('[Provision] Project error:', pErr?.message)
      return NextResponse.json({ error: 'Failed to provision project' }, { status: 500 })
    }

    // 4. If repoUrl provided, link git repo integration
    if (repoUrl) {
      try {
        await serviceDb
          .from('shippulse_repositories')
          .insert({
            workspace_id: workspace.id,
            github_repo_id: Date.now(),
            full_name: repoUrl.replace(/https?:\/\/github\.com\//, ''),
            name: projectName,
            owner: workspace.name,
            url: repoUrl,
            default_branch: repoBranch,
          })
      } catch (e: any) {
        console.warn('[Provision] Repo record error:', e)
      }
    }

    // 5. If initialRelease provided, persist as real draft release
    let createdRelease = null
    if (initialRelease) {
      try {
        const releaseSlug = (initialRelease.title || 'initial-release')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 60) || 'v1-0-0'
        const finalReleaseSlug = `${releaseSlug}-${Date.now().toString(36)}`

        const { data: releaseRow, error: rErr } = await serviceDb
          .from('shippulse_releases')
          .insert({
            project_id: project.id,
            workspace_id: workspace.id,
            title: initialRelease.title || 'Inaugural Release',
            slug: finalReleaseSlug,
            summary: initialRelease.summary || '',
            content: initialRelease.content || initialRelease.summary || '',
            version: initialRelease.version || 'v1.0.0',
            status: 'draft',
            is_ai_generated: true,
            output_mode: 'customer',
            created_by: user.id,
          })
          .select()
          .single()

        if (rErr) {
          console.warn('[Provision] Release insert error:', rErr.message)
        } else if (releaseRow) {
          createdRelease = releaseRow
          if (Array.isArray(initialRelease.entries) && initialRelease.entries.length > 0) {
            const entryInserts = initialRelease.entries.map((entry: any, idx: number) => ({
              release_id: releaseRow.id,
              project_id: project.id,
              title: entry.title || 'Enhancement',
              description: entry.description || '',
              is_ai_generated: true,
              sort_order: idx,
            }))
            await serviceDb.from('shippulse_release_entries').insert(entryInserts)
          }
        }
      } catch (relErr: any) {
        console.warn('[Provision] Initial release persistence warning:', relErr.message)
      }
    }

    return NextResponse.json({
      success: true,
      workspace,
      project,
      release: createdRelease,
    }, { status: 201 })
  } catch (err: any) {
    console.error('[API /api/onboarding/provision] Error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
