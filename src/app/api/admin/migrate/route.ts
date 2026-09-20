// ============================================================
// GET /api/admin/migrate
// ONE-TIME: Applies pending migrations via Supabase SDK
// Protected by ADMIN_SECRET env var
// DELETE THIS ROUTE after running once in production.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = createServiceClient()

  // Migration 003: Add github_access_token columns to shippulse_users
  // Supabase JS client cannot run raw DDL directly — we use the postgres extension
  // via a stored procedure. Instead, we verify by checking if column exists via
  // information_schema, and if not, instruct user to run manually.
  const { data: cols } = await serviceClient
    .from('information_schema.columns' as any)
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'shippulse_users')
    .in('column_name', ['github_access_token', 'github_token_scope', 'github_token_updated'])

  const existing = (cols as any[])?.map((c: any) => c.column_name) ?? []
  const missing = ['github_access_token', 'github_token_scope', 'github_token_updated'].filter(
    (c) => !existing.includes(c)
  )

  if (missing.length === 0) {
    return NextResponse.json({
      status: 'already_applied',
      message: 'All columns already exist. Migration 003 was already applied.',
    })
  }

  return NextResponse.json({
    status: 'manual_required',
    message: 'Please run the following SQL in your Supabase SQL Editor:',
    sql: `ALTER TABLE public.shippulse_users
  ADD COLUMN IF NOT EXISTS github_access_token  TEXT,
  ADD COLUMN IF NOT EXISTS github_token_scope   TEXT,
  ADD COLUMN IF NOT EXISTS github_token_updated TIMESTAMPTZ;`,
    missing_columns: missing,
  })
}
