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
      .select('id, workspace_id, name, slug')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) {
      const { data: matched } = await serviceDb
        .from('shippulse_projects')
        .select('id, workspace_id, name, slug')
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
          .select('id, workspace_id, name, slug')
          .in('workspace_id', workspaceIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        project = anyProj
      }
    }

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Find the active repository connection for this project
    const { data: connection } = await serviceDb
      .from('shippulse_repository_connections')
      .select('id, repository_id, branch, is_active')
      .eq('project_id', project.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let repoData = null
    if (connection?.repository_id) {
      const { data: repoRecord } = await serviceDb
        .from('shippulse_repositories')
        .select('id, full_name, name, owner, url, default_branch, last_synced_at')
        .eq('id', connection.repository_id)
        .maybeSingle()

      if (repoRecord) {
        repoData = {
          repoUrl: repoRecord.url,
          fullName: repoRecord.full_name,
          defaultBranch: connection.branch || repoRecord.default_branch || 'main',
          lastSync: repoRecord.last_synced_at
            ? new Date(repoRecord.last_synced_at).toLocaleString()
            : 'Never',
        }
      }
    }

    return NextResponse.json({ repo: repoData })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error: ' + (err?.message || '') }, { status: 500 })
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
      .select('id, workspace_id, name, slug')
      .eq('slug', projectSlug)
      .is('deleted_at', null)
      .maybeSingle()

    if (!project) {
      const { data: matched } = await serviceDb
        .from('shippulse_projects')
        .select('id, workspace_id, name, slug')
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
          .select('id, workspace_id, name, slug')
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
    const repoOwner = fullName.split('/')[0] || 'owner'
    const repoName = fullName.split('/')[1] || project.name
    const branch = defaultBranch || 'main'

    // Upsert repository in shippulse_repositories
    let repoId: string | null = null
    const { data: existingRepo } = await serviceDb
      .from('shippulse_repositories')
      .select('id')
      .eq('workspace_id', project.workspace_id)
      .eq('full_name', fullName)
      .maybeSingle()

    if (existingRepo?.id) {
      repoId = existingRepo.id
      await serviceDb
        .from('shippulse_repositories')
        .update({
          url: cleanRepoUrl,
          default_branch: branch,
          updated_at: new Date().toISOString(),
        })
        .eq('id', repoId)
    } else {
      const numericId = Math.abs(fullName.split('').reduce((acc: number, char: string) => (acc * 31 + char.charCodeAt(0)) | 0, 0)) || Date.now()
      const { data: repoRecord, error: repoErr } = await serviceDb
        .from('shippulse_repositories')
        .insert({
          workspace_id: project.workspace_id,
          github_repo_id: numericId,
          full_name: fullName,
          name: repoName,
          owner: repoOwner,
          url: cleanRepoUrl,
          default_branch: branch,
        })
        .select('id')
        .single()

      if (repoRecord) {
        repoId = repoRecord.id
      } else {
        const { data: fallbackRepo } = await serviceDb
          .from('shippulse_repositories')
          .select('id')
          .eq('workspace_id', project.workspace_id)
          .eq('full_name', fullName)
          .maybeSingle()
        if (fallbackRepo?.id) {
          repoId = fallbackRepo.id
        } else {
          return NextResponse.json({ error: 'Failed to create repository record: ' + (repoErr?.message || 'unknown') }, { status: 500 })
        }
      }
    }

    if (!repoId) {
      return NextResponse.json({ error: 'Failed to resolve repository record' }, { status: 500 })
    }

    // Deactivate previous connections for this project and activate this one
    await serviceDb
      .from('shippulse_repository_connections')
      .update({ is_active: false })
      .eq('project_id', project.id)

    const { error: connError } = await serviceDb
      .from('shippulse_repository_connections')
      .upsert({
        project_id: project.id,
        repository_id: repoId,
        branch: branch,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'project_id,repository_id' })

    if (connError) {
      return NextResponse.json({ error: 'Failed to save integration: ' + connError.message }, { status: 500 })
    }

    await serviceDb
      .from('shippulse_projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', project.id)

    return NextResponse.json({
      success: true,
      repoUrl: cleanRepoUrl,
      fullName,
      defaultBranch: branch,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error: ' + (err?.message || '') }, { status: 500 })
  }
}
