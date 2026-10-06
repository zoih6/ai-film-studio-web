// Intent Router — توجيه طلب المستخدم إلى أصغر مسار إنتاجي كافٍ.
// المصدر: workflows/intent-router.md + PRD §7 (أنواع المشاريع والتوجيه)
// قاعدة: intent-router هو مصدر القرار، والواجهة تعرض القرار بلغة مفهومة.

import type { IntentAnalysis, ProjectType } from '@/types'
import { intentAnalysisSchema } from '@/lib/validation/schemas'

export interface IntakeContext {
  idea: string
  projectType: ProjectType
  platform?: string | null
  durationSeconds?: number | null
  aspectRatio?: string | null
  language?: string | null
  tone?: string | null
  targetAudience?: string | null
  preferredModel?: string | null
  visualStyle?: string | null
  notes?: string | null
}

// توجيه استنتاجي سريع (heuristic) — يُدمج مع تحليل النموذج
export function heuristicRoute(intake: IntakeContext): {
  route: IntentAnalysis['suggestedRoute']
  type: ProjectType
  reason: string
} {
  const idea = intake.idea.toLowerCase()
  const combined = `${idea} ${intake.notes || ''}`.toLowerCase()

  const has = (...words: string[]) => words.some((w) => combined.includes(w))

  // 1) نطاق لقطة/برومبت واحد
  if (
    intake.projectType === 'prompt' ||
    has('برومبت', 'prompt', 'لقطة واحدة', 'صورة واحدة', 'single shot')
  ) {
    return {
      route: 'shortcut-prompt',
      type: 'prompt',
      reason: 'الطلب يبدو نطاقه لقطة أو برومبت واحدًا — أقصر مسار هو Shortcut بدون تشغيل خط الإنتاج كاملًا.',
    }
  }

  // 2) سلسلة
  if (
    intake.projectType === 'series' ||
    has('سلسلة', 'حلقات', 'episodes', 'series', 'قناة', 'موسم')
  ) {
    return {
      route: 'series-engine',
      type: 'series',
      reason: 'الطلب يتضمن أكثر من عمل متكرر — Series Engine يضبط توقيعًا بصريًا موحدًا واستمرارية بين الحلقات.',
    }
  }

  // 3) موشن جرافيك
  if (
    intake.projectType === 'motion' ||
    has('موشن', 'motion graphics', 'kinetic', 'تايبوغرافي', 'infographic', 'إنفوغرافيك')
  ) {
    return {
      route: 'motion-engine',
      type: 'motion',
      reason: 'الطلب موجه للموشن جرافيك والنص المتحرك — يركز على بنية المشاهد وإيقاع العناصر لا التصوير الواقعي.',
    }
  }

  // 4) إعلان / منتج
  const productWords = has('إعلان', 'منتج', 'advert', 'product', 'براند', 'brand', 'ترويجي', 'promo', 'متجر', 'تطبيق')
  if (intake.projectType === 'commercial' || productWords) {
    return {
      route: 'commercial-engine',
      type: 'commercial',
      reason: 'الطلب يعرض منتجًا أو علامة تجارية — Commercial Engine يثبت Product Anchor وEnd Card ويسلم حزمة إعلان كاملة.',
    }
  }

  // 5) وثائقي
  const docWords = has('وثائقي', 'documentary', 'essay', 'تاريخي', 'تقرير', 'شرح', 'faceless')
  if (intake.projectType === 'documentary' || docWords) {
    return {
      route: 'documentary-engine',
      type: 'documentary',
      reason: 'المحتوى سردي/معرفي وثائقي — Documentary Engine يبني سردًا وBeats وثامبنيلات دون تمثيل واقعي.',
    }
  }

  // 6) مسار كامل
  return {
    route: 'full-production',
    type: intake.projectType === 'auto' ? 'film' : intake.projectType,
    reason: 'المشروع سردي متعدد المشاهد — المسار الكامل يغطي Concept والسكربت والاستمرارية والتسليم.',
  }
}

// بناء تعليمات تحليل النية للمزود
export function buildAnalysisPrompt(intake: IntakeContext): { system: string; task: string; schemaHint: string } {
  const heur = heuristicRoute(intake)
  const system = `أنت موجّه نوايا (Intent Router) في استوديو إنتاج فيديو بالذكاء الاصطناعي. مهمتك تحويل فكرة المستخدم إلى أصغر مسار إنتاجي كافٍ، لا أكبر مسار ممكن.

قواعد التوجيه بالأولوية:
1. طلب برومبت/لقطة واحدة → route: shortcut-prompt
2. سلسلة أو حلقات متكررة → route: series-engine
3. موشن جرافيك/تايبوغرافي → route: motion-engine
4. إعلان منتج/براند → route: commercial-engine
5. وثائقي/فيديو إسّيه/محتوى بدون وجه → route: documentary-engine
6. مشروع سردي متعدد المشاهد → route: full-production

أعد JSON فقط بالعربية لكل النصوص التوضيحية (summary وrouteReason وmissingInfo) وبالمصطلحات التقنية بالإنجليزية حيث يلزم.`

  const task = `حلّل فكرة المشروع التالية وحدد المسار الأنسب.

فكرة المستخدم:
"""${intake.idea}"""

نوع المشروع المختار من المستخدم: ${intake.projectType}
${intake.platform ? `المنصة: ${intake.platform}` : ''}
${intake.durationSeconds ? `المدة المطلوبة: ${intake.durationSeconds} ثانية` : ''}
${intake.aspectRatio ? `النسبة: ${intake.aspectRatio}` : ''}
${intake.tone ? `النبرة: ${intake.tone}` : ''}
${intake.targetAudience ? `الجمهور: ${intake.targetAudience}` : ''}
${intake.notes ? `ملاحظات: ${intake.notes}` : ''}

نتيجة التوجيه الاستنتاجي السريع (خذها كمرشح قوي، وصحّحها فقط إذا كان هناك دليل صريح في الفكرة): ${heur.route} — ${heur.reason}

حدد: intent (ما الذي يريده المستخدم)، scope، suggestedType، suggestedRoute، routeReason (سبب مفهوم للمستخدم بالعربية)، summary (ملخص الفكرة بجملتين)، missingInfo (أسئلة ناقصة مهمة فقط، إن لم يوجد ضع مصفوفة فارغة)، inferred (قيم مستنتجة: platform، durationSeconds، aspectRatio، tone، targetAudience).`

  const schemaHint = `أعد JSON بهذا الشكل تمامًا:
{
  "intent": "string",
  "scope": "single_shot | scene | full_project | prompt_only",
  "suggestedType": "commercial | documentary | film | motion | series | prompt",
  "suggestedRoute": "shortcut-prompt | commercial-engine | documentary-engine | full-production | motion-engine | series-engine",
  "routeReason": "string",
  "summary": "string",
  "missingInfo": ["string"],
  "inferred": { "platform": "string?", "durationSeconds": number?, "aspectRatio": "string?", "tone": "string?", "language": "string?", "targetAudience": "string?" }
}`

  return { system, task, schemaHint }
}

// تفسير نتيجة المزود مع تراجع آمن إلى التوجيه الاستنتاجي
export function interpretAnalysis(
  raw: unknown,
  intake: IntakeContext,
): IntentAnalysis {
  const parsed = intentAnalysisSchema.safeParse(raw)
  const heur = heuristicRoute(intake)
  if (parsed.success) {
    return parsed.data
  }
  // Fallback: دمج السبب الاستنتاجي مع بيانات أساسية
  return {
    intent: 'إنتاج فيديو من فكرة المستخدم',
    scope: heur.route === 'shortcut-prompt' ? 'prompt_only' : 'full_project',
    suggestedType: heur.type,
    suggestedRoute: heur.route,
    routeReason: heur.reason,
    summary: intake.idea.slice(0, 200),
    missingInfo: [],
    inferred: {},
  }
}
