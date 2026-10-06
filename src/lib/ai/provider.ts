// AI Provider Abstraction — المصدر: docs/product/PRD.md §10
// قاعدة أساسية: كل استدعاءات النموذج تمر عبر الخادم فقط.

import { z } from 'zod'

export interface GenerationRequest {
  system: string
  task: string
  jsonSchemaHint?: string
  maxTokens?: number
  temperature?: number
}

export interface GenerationResult {
  text: string
  provider: string
  model: string
  latencyMs: number
}

export interface ProviderHealth {
  ok: boolean
  provider: string
  model: string
  message?: string
}

export interface AIProvider {
  readonly name: string
  generate(input: GenerationRequest): Promise<GenerationResult>
  healthCheck(): Promise<ProviderHealth>
}

// أخطاء موحدة للمزودين
export class AIProviderError extends Error {
  code: string
  retryable: boolean
  provider: string

  constructor(message: string, opts: { code?: string; retryable?: boolean; provider?: string } = {}) {
    super(message)
    this.name = 'AIProviderError'
    this.code = opts.code ?? 'AI_PROVIDER_ERROR'
    this.retryable = opts.retryable ?? true
    this.provider = opts.provider ?? 'unknown'
  }
}

// وسيط التحقق من نص JSON
export function requireNonEmpty(text: string | undefined | null, provider: string): string {
  if (!text || text.trim().length === 0) {
    throw new AIProviderError('استجابة فارغة من مزود الذكاء الاصطناعي.', {
      code: 'AI_EMPTY_RESPONSE',
      retryable: true,
      provider,
    })
  }
  return text
}

export const generationRequestSchema = z.object({
  system: z.string().min(1),
  task: z.string().min(1),
  jsonSchemaHint: z.string().optional(),
  maxTokens: z.number().int().positive().max(65536).optional(),
  temperature: z.number().min(0).max(2).optional(),
})
