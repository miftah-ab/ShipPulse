// ============================================================
// ShipPulse — OpenRouter Provider (Fallback)
// ============================================================

import type { AIGenerateRequest, AIProvider, AIProviderResult } from '../types'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Map our model names to OpenRouter equivalents
const MODEL_MAP: Record<string, string> = {
  'llama-3.3-70b-versatile': 'meta-llama/llama-3.3-70b-instruct',
  'llama-3.1-8b-instant': 'meta-llama/llama-3.1-8b-instruct',
  'mixtral-8x7b-32768': 'mistralai/mixtral-8x7b-instruct',
}

function resolveOpenRouterModel(requested: string): string {
  return MODEL_MAP[requested] ?? 'meta-llama/llama-3.3-70b-instruct'
}

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter'

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set')
    }
  }

  async generate(request: AIGenerateRequest): Promise<AIProviderResult> {
    const model = resolveOpenRouterModel(request.model)
    const startTime = Date.now()

    const body = {
      model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userMessage },
      ],
      temperature: request.temperature ?? 0.4,
      max_tokens: request.maxTokens ?? 2048,
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'https://shippulse.vercel.app',
        'X-Title': process.env.OPENROUTER_SITE_NAME ?? 'ShipPulse',
      },
      body: JSON.stringify(body),
    })

    const latencyMs = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`OpenRouter API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''

    return {
      provider: 'openrouter',
      model: data.model ?? model,
      content,
      tokensInput: data.usage?.prompt_tokens,
      tokensOutput: data.usage?.completion_tokens,
      tokensTotal: data.usage?.total_tokens,
      latencyMs,
      success: true,
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
