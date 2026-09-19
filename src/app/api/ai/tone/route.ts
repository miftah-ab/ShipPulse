// ============================================================
// POST /api/ai/tone  — rewrites release notes with a given tone
// Uses Groq (llama-3.1-8b-instant) or falls back to a simple transform
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { content, tone, version } = body

    if (!content || !tone) {
      return NextResponse.json({ error: 'content and tone are required' }, { status: 400 })
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY

    if (!GROQ_API_KEY) {
      // Graceful fallback — simple transformations without AI
      return NextResponse.json({
        content: transformTone(content, tone, version),
      })
    }

    const toneInstructions: Record<string, string> = {
      executive: 'Rewrite these release notes as a concise executive brief in 2-3 sentences. Focus on business impact and outcomes. Use professional language.',
      bulleted: 'Convert these release notes into a clean bulleted list. Each bullet should be short (1 line max). Use markdown list syntax (*).',
      widget: 'Condense these release notes into a single short paragraph (max 2 sentences) suitable for an in-app notification widget. Be direct and user-friendly.',
    }

    const systemPrompt = toneInstructions[tone] || 'Rewrite these release notes in a clear and professional tone.'

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Version: ${version || 'latest'}\n\nRelease Notes:\n${content}` },
        ],
        max_tokens: 512,
        temperature: 0.6,
      }),
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error('[AI Tone] Groq error:', err)
      return NextResponse.json({
        content: transformTone(content, tone, version),
      })
    }

    const groqData = await groqRes.json()
    const transformed = groqData.choices?.[0]?.message?.content?.trim()

    return NextResponse.json({ content: transformed || transformTone(content, tone, version) })
  } catch (err: any) {
    console.error('[AI Tone] Error:', err.message)
    return NextResponse.json({ error: 'AI tone transformation failed' }, { status: 500 })
  }
}

function transformTone(content: string, tone: string, version?: string): string {
  if (tone === 'executive') {
    const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'))
    return `## Executive Brief${version ? ` — ${version}` : ''}\n${lines.slice(0, 3).join(' ').replace(/[-*]/g, '').trim()}`
  }
  if (tone === 'bulleted') {
    const lines = content
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('#'))
      .map((l) => `* ${l.replace(/^[-*]\s*/, '').trim()}`)
      .slice(0, 6)
    return `## Highlights${version ? ` (${version})` : ''}\n${lines.join('\n')}`
  }
  if (tone === 'widget') {
    const first = content.split('\n').find((l) => l.trim() && !l.startsWith('#')) || content
    return first.replace(/^[-*]\s*/, '').trim()
  }
  return content
}
