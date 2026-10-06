// سياسة تحليل مخرجات النموذج: JSON parse + محاولة إصلاح واحدة فقط ثم خطأ قابل للتشخيص.
// المصدر: PRD §10 (قواعد Context — عند فشل parsing أعد محاولة إصلاح JSON مرة واحدة فقط)

import { z } from 'zod'

export class StageParseError extends Error {
  code = 'AI_PARSE_ERROR'
  retryable: boolean
  detail: string

  constructor(message: string, detail: string) {
    super(message)
    this.name = 'StageParseError'
    this.retryable = true
    this.detail = detail
  }
}

export function parseModelJson(raw: string): unknown {
  // تنظيف أساسي: BOM ومحارف التحكم و trailing whitespace
  let text = raw.replace(/^\uFEFF/, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim()

  // 1) إزالة غلاف markdown الشائع (متكرر أو مفرد)
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fence) text = fence[1].trim()

  // 2) محاولة مباشرة
  try {
    return JSON.parse(text)
  } catch (firstErr) {
    // 3) محاولة إصلاح واحدة فقط: قصّ ما قبل أول { أو بعد آخر }
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) {
      const sliced = text.slice(start, end + 1)
      try {
        return JSON.parse(sliced)
      } catch {
        // 4) إصلاح فاصلة معلّقة داخل الكائن المقصوص
        try {
          return JSON.parse(sliced.replace(/,\s*([}\]])/g, '$1'))
        } catch {
          /* fallthrough */
        }
      }
    }
    throw new StageParseError(
      'تعذر تحليل مخرجات هذه المرحلة إلى JSON صالح.',
      `${(firstErr as Error).message} | raw head: ${raw.slice(0, 160)}`,
    )
  }
}

export function validateStageOutput<T>(stageId: string, schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join(' | ')
    throw new StageParseError(
      `مخرجات مرحلة "${stageId}" لا تطابق العقد المطلوب.`,
      issues,
    )
  }
  return result.data
}
