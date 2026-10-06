// مزود GLM الداخلي — للاختبار المحلي في بيئة التطوير فقط
// يُحمَّل ديناميكيًا حتى لا يُستدعى إطلاقًا في بيئة الإنتاج (Vercel → Gemini).

import {
  AIProvider,
  AIProviderError,
  GenerationRequest,
  GenerationResult,
  ProviderHealth,
  requireNonEmpty,
} from './provider'

export class GlmProvider implements AIProvider {
  readonly name = 'glm-internal'
  private model = 'glm-dev'

  private async complete(system: string, task: string): Promise<string> {
    const { default: ZAI } = await import('z-ai-web-dev-sdk')
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: system },
        { role: 'user', content: task },
      ],
      thinking: { type: 'disabled' },
    })
    return requireNonEmpty(completion.choices[0]?.message?.content, this.name)
  }

  async generate(input: GenerationRequest): Promise<GenerationResult> {
    const started = Date.now()
    try {
      const task = input.jsonSchemaHint
        ? `${input.task}\n\n${input.jsonSchemaHint}`
        : input.task
      const text = await this.complete(input.system, task)
      return {
        text,
        provider: this.name,
        model: this.model,
        latencyMs: Date.now() - started,
      }
    } catch (err) {
      if (err instanceof AIProviderError) throw err
      throw new AIProviderError('تعذر الاتصال بمزود GLM الداخلي.', {
        code: 'AI_PROVIDER_ERROR',
        retryable: true,
        provider: this.name,
      })
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    try {
      await this.complete('Reply with: ok', 'Health check.')
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
