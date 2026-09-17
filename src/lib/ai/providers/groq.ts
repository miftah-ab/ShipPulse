// ============================================================
// ShipPulse  -  Groq Provider
// Implements AIProvider interface using the Groq SDK
// ============================================================

import Groq from 'groq-sdk'
import type { AIGenerateRequest, AIProvider, AIProviderResult } from '../types'

const GROQ_MODELS = {
  'llama-3.3-70b-versatile': 'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant': 'llama-3.1-8b-instant',
  'mixtral-8x7b-32768': 'mixtral-8x7b-32768',
} as const

type GroqModel = keyof typeof GROQ_MODELS

function resolveGroqModel(requested: string): GroqModel {
  if (requested in GROQ_MODELS) return requested as GroqModel
  // Default fallback within Groq
  return 'llama-3.3-70b-versatile'
}

export class GroqProvider implements AIProvider {
  name = 'groq'
  private client: Groq

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set')
    }
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  }

  async generate(request: AIGenerateRequest): Promise<AIProviderResult> {
    const model = resolveGroqModel(request.model)
    const startTime = Date.now()

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userMessage },
        ],
        temperature: request.temperature ?? 0.4,
        max_tokens: request.maxTokens ?? 2048,
      })

      const latencyMs = Date.now() - startTime
      const choice = completion.choices[0]
      const content = choice?.message?.content ?? ''

      return {
        provider: 'groq',
        model,
        content,
        tokensInput: completion.usage?.prompt_tokens,
        tokensOutput: completion.usage?.completion_tokens,
        tokensTotal: completion.usage?.total_tokens,
        latencyMs,
        success: true,
      }
    } catch (err) {
      const latencyMs = Date.now() - startTime
      const error = err instanceof Error ? err : new Error(String(err))

      // Log without exposing API key or sensitive data
      if (process.env.AI_DEBUG_LOGGING === 'true') {
        console.error('[GroqProvider] Error:', {
          model,
          latencyMs,
          errorType: error.name,
          message: error.message,
        })
      }

      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list()
      return true
    } catch {
      return false
    }
  }
}
