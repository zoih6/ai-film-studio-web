// مصنع المزودين — اختيار المزود حسب البيئة دون تغيير الواجهة.
// Gemini هو المزود الأساسي في الإنتاج. GLM الداخلي متاح لبيئة التطوير المحلية.

import { AIProvider, AIProviderError } from './provider'
import { GeminiProvider } from './gemini-provider'

export function resetProviderCache(): void {
  // مزودو Gemini وGLM خفيفو الإنشاء — لا حاجة لكاش فعلي هنا.
}

export async function getProviderAsync(): Promise<AIProvider> {
  const requested = (process.env.AI_PROVIDER || '').toLowerCase()

  if (requested === 'glm') {
    const { GlmProvider } = await import('./glm-provider')
    return new GlmProvider()
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new AIProviderError(
      'لم يتم ضبط GEMINI_API_KEY. أضفه في متغيرات البيئة على الخادم.',
      { code: 'AI_CONFIG_ERROR', retryable: false },
    )
  }

  return new GeminiProvider()
}
