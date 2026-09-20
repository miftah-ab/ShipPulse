// ============================================================
// GET  /api/dashboard/integration?projectSlug=...
// PATCH /api/dashboard/integration — save connected GitHub repo
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('projectSlug')
    if (!projectSlug) return NextResponse.json({ error: 'projectSlug is required' }, { status: 400 })

    const serviceDb = createServiceClient()

    let { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id, repo_url, default_branch, last_synced_at')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) {
      const { data: matched } = await serviceDb
        .from('shippulse_projects')
        .select('id, workspace_id, repo_url, default_branch, last_synced_at')
        .ilike('slug', `${projectSlug}%`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      project = matched
    }

    if (!project) {
      const { data: userMemberships } = await serviceDb
        .from('shippulse_memberships')
        .select('workspace_id')
        .eq('user_id', user.id)

      if (userMemberships && userMemberships.length > 0) {
        const workspaceIds = userMemberships.map((m: any) => m.workspace_id)
        const { data: anyProj } = await serviceDb
          .from('shippulse_projects')
          .select('id, workspace_id, repo_url, default_branch, last_synced_at')
          .in('workspace_id', workspaceIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        project = anyProj
      }
    }

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const hasRepo = !!project.repo_url

    return NextResponse.json({
      repo: hasRepo
        ? {
            repoUrl: project.repo_url,
            defaultBranch: project.default_branch || 'main',
            lastSync: project.last_synced_at
              ? new Date(project.last_synced_at).toLocaleString()
              : 'Never',
          }
        : null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { projectSlug, repoUrl, defaultBranch, repoFullName } = body

    if (!projectSlug || !repoUrl) {
      return NextResponse.json({ error: 'projectSlug and repoUrl are required' }, { status: 400 })
    }

    const serviceDb = createServiceClient()

    let { data: project } = await serviceDb
      .from('shippulse_projects')
      .select('id, workspace_id, name')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) {
      const { data: matched } = await serviceDb
        .from('shippulse_projects')
        .select('id, workspace_id, name')
        .ilike('slug', `${projectSlug}%`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      project = matched
    }

    if (!project) {
      const { data: userMemberships } = await serviceDb
        .from('shippulse_memberships')
        .select('workspace_id')
        .eq('user_id', user.id)

      if (userMemberships && userMemberships.length > 0) {
        const workspaceIds = userMemberships.map((m: any) => m.workspace_id)
        const { data: anyProj } = await serviceDb
          .from('shippulse_projects')
          .select('id, workspace_id, name')
          .in('workspace_id', workspaceIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        project = anyProj
      }
    }

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data: membership } = await serviceDb
      .from('shippulse_memberships')
      .select('role')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Normalize repo URL
    const cleanRepoUrl = repoUrl.startsWith('http') ? repoUrl : `https://github.com/${repoUrl.replace(/^\//, '')}`
    const fullName = repoFullName || cleanRepoUrl.replace(/https?:\/\/github\.com\//, '').replace(/\.git$/, '')

    const { error } = await serviceDb
      .from('shippulse_projects')
      .update({
        repo_url: cleanRepoUrl,
        default_branch: defaultBranch || 'main',
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to save integration: ' + error.message }, { status: 500 })
    }

    // Upsert repository record
    try {
      const { data: repoRecord } = await serviceDb
        .from('shippulse_repositories')
        .insert({
          workspace_id: project.workspace_id,
          github_repo_id: Date.now(),
          full_name: fullName,
          name: fullName.split('/')[1] || project.name,
          owner: fullName.split('/')[0] || 'owner',
          url: cleanRepoUrl,
          default_branch: defaultBranch || 'main',
        })
        .select()
        .single()

      if (repoRecord) {
        await serviceDb
          .from('shippulse_repository_connections')
          .upsert({
            project_id: project.id,
            repository_id: repoRecord.id,
            branch: defaultBranch || 'main',
            is_active: true,
          }, { onConflict: 'project_id,repository_id' })
      }
    } catch (e: any) {
      console.warn('[Integration] Repo connection warning:', e.message)
    }

    return NextResponse.json({ success: true, repoUrl: cleanRepoUrl, fullName })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
