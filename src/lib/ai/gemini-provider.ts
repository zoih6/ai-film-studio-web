// Gemini Adapter — أول تنفيذ لواجهة AIProvider
// يستدعي Gemini REST API من الخادم فقط. لا يُستدعى من المتصفح إطلاقًا.

import {
  AIProvider,
  AIProviderError,
  GenerationRequest,
  GenerationResult,
  ProviderHealth,
  requireNonEmpty,
} from './provider'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
const REQUEST_TIMEOUT_MS = 55_000

interface GeminiPart {
  text?: string
}

interface GeminiContent {
  role?: string
  parts: GeminiPart[]
}

interface GeminiResponse {
  candidates?: {
    content?: GeminiContent
    finishReason?: string
  }[]
  promptFeedback?: {
    blockReason?: string
  }
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini'
  private apiKey: string
  private model: string

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || ''
    this.model = model || DEFAULT_MODEL
    if (!this.apiKey) {
      throw new AIProviderError('GEMINI_API_KEY غير مضبوط في بيئة الخادم.', {
        code: 'AI_CONFIG_ERROR',
        retryable: false,
      })
    }
  }

  async generate(input: GenerationRequest): Promise<GenerationResult> {
    const started = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const body = {
        systemInstruction: {
          parts: [{ text: input.system }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: input.jsonSchemaHint ? `${input.task}\n\n${input.jsonSchemaHint}` : input.task }],
          },
        ],
        generationConfig: {
          temperature: input.temperature ?? 0.7,
          maxOutputTokens: input.maxTokens ?? 16384,
          ...(input.jsonSchemaHint ? { responseMimeType: 'application/json' } : {}),
        },
      }

      const res = await fetch(`${GEMINI_BASE}/models/${this.model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      const data = (await res.json()) as GeminiResponse

      if (!res.ok) {
        const status = data.error?.status || ''
        const message = data.error?.message || `Gemini HTTP ${res.status}`
        // أخطاء المصادقة/التهيئة غير قابلة لإعادة المحاولة
        const nonRetryable =
          res.status === 400 && /api key|api_key/i.test(message)
        throw new AIProviderError(
          humanizeGeminiError(message, status),
          {
            code: nonRetryable ? 'AI_CONFIG_ERROR' : 'AI_PROVIDER_ERROR',
            retryable: !nonRetryable,
            provider: this.name,
          },
        )
      }

      if (data.promptFeedback?.blockReason) {
        throw new AIProviderError('رفض مزود الذكاء الاصطناعي هذا الطلب لأسباب تتعلق بالسياسة.', {
          code: 'AI_BLOCKED',
          retryable: false,
          provider: this.name,
        })
      }

      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
      requireNonEmpty(text, this.name)

      return {
        text,
        provider: this.name,
        model: this.model,
        latencyMs: Date.now() - started,
      }
    } catch (err) {
      if (err instanceof AIProviderError) throw err
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AIProviderError('انتهت مهلة الاتصال بمزود الذكاء الاصطناعي.', {
          code: 'AI_TIMEOUT',
          retryable: true,
          provider: this.name,
        })
      }
      throw new AIProviderError('تعذر الاتصال بمزود الذكاء الاصطناعي الآن.', {
        code: 'AI_NETWORK_ERROR',
        retryable: true,
        provider: this.name,
      })
    } finally {
      clearTimeout(timer)
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    try {
      await this.generate({
        system: 'You are a health probe. Reply with the single word: ok',
        task: 'Health check.',
        maxTokens: 512,
        temperature: 0,
      })
      return { ok: true, provider: this.name, model: this.model }
    } catch (err) {
      return {
        ok: false,
        provider: this.name,
        model: this.model,
        message: err instanceof Error ? err.message : 'unknown',
      }
    }
  }
}

function humanizeGeminiError(message: string, status: string): string {
  if (status === 'FAILED_PRECONDITION' || /location is not supported/i.test(message)) {
    return 'مزود Gemini غير متاح من الموقع الجغرافي الحالي للخادم. سيتم حل ذلك عند النشر على بيئة الإنتاج (Vercel).'
  }
  if (/quota|RESOURCE_EXHAUSTED/i.test(message + status)) {
    return 'تم تجاوز حصة الاستخدام لمزود الذكاء الاصطناعي. أعد المحاولة بعد قليل.'
  }
  if (/not found|404/i.test(message + status)) {
    return 'النموذج المطلوب غير متاح حاليًا لدى المزود.'
  }
  return 'تعذر توليد هذه المرحلة الآن من مزود Gemini.'
}
