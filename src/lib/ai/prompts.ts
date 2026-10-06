// بناة تعليمات المراحل — تقطير منهجية AI Film Studio (SKILL.md + workflows + schemas)
// لكل مرحلة: تعليمات نظام + مهمة مع سياق تدريجي (Progressive Disclosure) + تلميح JSON.

import type { IntentAnalysis } from '@/types'
import type { IntakeContext } from '@/lib/routing/intent-router'

const ENGINE_CONTEXT: Record<string, string> = {
  'commercial-engine': `أنت تعمل داخل محرك الإعلانات (E2 Commercial): يجب أن يحافظ المنتج على هويته القابلة للتعرّف عبر كل اللقطات (Product Anchor)، وينتهي العمل بـEnd Card واضح، والمخرجات موجهة للاستخدام التسويقي.`,
  'documentary-engine': `أنت تعمل داخل محرك الوثائقي (E1 Documentary): السرد معرفي/سردي، الأسلوب كولاج أرشيفي أو VOX-style إن ناسب، مع ثامبنيلات مقترحة، بلا تمثيل واقعي لازم.`,
  'series-engine': `أنت تعمل داخل محرك السلاسل (E4 Series): يجب تثبيت توقيع بصري موحد للقناة واستمرارية بين الحلقات، مع قالب حلقة قابل للتكرار.`,
  'motion-engine': `أنت تعمل داخل محرك الموشن جرافيك: البنية مشاهد نصية وعناصر متحركة، التركيز على الإيقاع والنص والانتقالات، لا التصوير الواقعي.`,
  'full-production': `أنت تعمل في المسار الكامل M0–M11: مشروع سردي متعدد المشاهد باستمرارية كاملة.`,
  'shortcut-prompt': `أنت تعمل في مسار البرومبت السريع: مخرج واحد نهائي فقط.`,
}

const BASE_SYSTEM = `أنت «استوديو أفلام AI» — منتج أفلام فيديو بالذكاء الاصطناعي محترف، تعمل وفق منهجية صارمة:

1. الفكرة أولًا، والبرومبت لاحقًا: لا تكتب برومبت قبل تثبيت البرييف والإيقاع والهوية البصرية.
2. الاستمرارية مقدسة: كل كيان متكرر (شخصية/منتج/مكان) له Identity String حرفي ثابت يُمرر كما هو في كل مرة يظهر فيها.
3. برومبت واحد كامل لكل فريم/لقطة: كتلة واحدة مستقلة قابلة للنسخ، تحوي الهوية والتكوين والبيئة والكاميرا والإضاءة والأسلوب. ممنوع لغة تجميع مثل "أضف للبرومبت السابق".
4. الستوري بورد قبل البرومبتات دائمًا.
5. احترم قيود المنصة: النسبة، المدة، الحجم الآمن للنص.
6. البرومبتات النصية (image/motion) تُكتب بالإنجليزية لأنها تُغذّى لنماذج توليد إنجليزية، بينما كل التحليل والخطة والتوصيات بالعربية.
7. أعد JSON صالحًا فقط، بلا أي نص خارجه.`

export interface StagePromptInput {
  stageId: string
  intake: IntakeContext
  analysis: IntentAnalysis | null
  route: string
  previousOutputs: Record<string, unknown>
  regenerateNote?: string
}

function intakeBlock(intake: IntakeContext): string {
  return `## معطيات المشروع
- الفكرة: """${intake.idea}"""
${intake.platform ? `- المنصة: ${intake.platform}` : ''}
${intake.durationSeconds ? `- المدة: ${intake.durationSeconds} ثانية` : '- المدة: غير محددة (اقترح الأنسب للمنصة)'}
${intake.aspectRatio ? `- النسبة: ${intake.aspectRatio}` : '- النسبة: غير محددة (استنتجها من المنصة)'}
- اللغة: ${intake.language || 'ar'}
${intake.tone ? `- النبرة: ${intake.tone}` : ''}
${intake.targetAudience ? `- الجمهور: ${intake.targetAudience}` : ''}
${intake.visualStyle ? `- اتجاه بصري مطلوب: ${intake.visualStyle}` : ''}
${intake.preferredModel ? `- نموذج التوليد المفضل: ${intake.preferredModel}` : ''}
${intake.notes ? `- ملاحظات: ${intake.notes}` : ''}`
}

function contextBlock(previousOutputs: Record<string, unknown>): string {
  const stages = [
    'brief',
    'concept',
    'narrative',
    'beats',
    'style-entities',
    'storyboard',
    'shot-cards',
    'image-prompts',
  ]
  const parts: string[] = []
  for (const s of stages) {
    if (previousOutputs[s] !== undefined && previousOutputs[s] !== null) {
      parts.push(`### مخرجات مرحلة ${s} (معتمدة — التزم بها حرفيًا في الهويات والمدد):\n${JSON.stringify(previousOutputs[s], null, 1)}`)
    }
  }
  return parts.length ? `## سياق المراحل السابقة\n${parts.join('\n\n')}` : ''
}

function jsonHintFor(stageId: string): string {
  const hints: Record<string, string> = {
    brief: `{
  "title": "عنوان المشروع", "objective": "الهدف", "keyMessage": "الرسالة الأساسية",
  "audience": "الجمهور", "platformNotes": "ملاحظات المنصة والنسبة",
  "deliverables": ["..."], "constraints": ["..."], "risks": ["..."]
}`,
    concept: `{
  "bigIdea": "...", "logline": "...", "hook": "...", "visualMetaphor": "...",
  "moodKeywords": ["3-6 كلمات"], "toneNotes": "..."
}`,
    narrative: `{
  "structure": ["فصل 1: ...", "فصل 2: ..."],
  "script": "سكربت مختصر بالمشاهد",
  "voiceover": "نص التعليق الصوتي كاملًا",
  "cta": "دعوة لفعل إن وجدت"
}`,
    beats: `{
  "totalDurationSeconds": number,
  "beats": [{ "id": "B1", "purpose": "وظيفة", "startSeconds": 0, "durationSeconds": 3, "visual": "ما يُرى", "audio": "ما يُسمع", "transition": "نوع الانتقال" }]
}`,
    'style-entities': `{
  "styleLock": "جملة حرفية طويلة تصف الأسلوب البصري بالكامل، ستُنسخ كما هي في كل برومبت",
  "styleDna": { "palette": ["hex أو أسماء"], "lighting": "...", "texture": "...", "cameraCharacter": "...", "motionCharacter": "..." },
  "entities": [{ "id": "CHAR-01", "name": "...", "kind": "character|product|location|prop|style", "identityString": "وصف حرفي ثابت 25+ كلمة", "notes": "" }],
  "productAnchor": "وصف المنتج الحرفي إن وُجد منتج"
}`,
    storyboard: `{
  "aspectRatio": "16:9", "totalDurationSeconds": number,
  "scenes": [{ "sceneId": "SC01", "title": "...", "purpose": "وظيفة المشهد",
    "frames": [{ "frameId": "FR01", "shotId": "SC01_SH01", "role": "opening", "visualDescription": "وصف قابل للتخيل", "durationSeconds": 3, "startState": "حالة البداية", "endState": "حالة النهاية" }] }]
}`,
    'shot-cards': `{
  "shots": [{ "shotId": "SC01_SH01", "frameId": "FR01", "durationSeconds": 3, "goal": "لماذا هذه اللقطة", "frameDescription": "وصف الفريم", "camera": "نوع الكاميرا والعدسة", "movement": "حركة الكاميرا", "audioHint": "الصوت المتوقع", "references": "الكيانات المستخدمة" }]
}`,
    'image-prompts': `{
  "targetModel": "اسم النموذج المستهدف أو any",
  "prompts": [{ "frameId": "FR01", "shotId": "SC01_SH01", "title": "اسم اللقطة", "prompt": "برومبت إنجليزي كامل مستقل: Identity Strings + Style Lock + composition + environment + camera + lighting + style + constraints" }]
}`,
    'motion-prompts': `{
  "targetModel": "any",
  "prompts": [{ "shotId": "SC01_SH01", "title": "...", "durationSeconds": 3, "prompt": "برومبت تحريك إنجليزي كامل: subject action + camera move + pacing + continuity + audio cues", "firstFrameRole": "دور أول فريم", "lastFrameRole": "دور آخر فريم" }]
}`,
    audio: `{
  "voiceover": { "direction": "توجيه الأداء", "language": "ar", "fullScript": "السكربت الكامل" },
  "music": { "direction": "...", "bpm": "رقم", "reference": "مرجع" },
  "sfx": [{ "beat": "B1", "sound": "..." }],
  "mixNotes": "ملاحظات المكس"
}`,
    delivery: `{
  "exportSpecs": { "resolution": "...", "fps": "...", "format": "...", "aspectRatio": "...", "maxFileSizeMb": "" },
  "qualityGates": [{ "gate": "G4 Prompt Completeness", "status": "pass|warn|fail", "note": "" }],
  "checklist": ["خطوات فحص نهائية"],
  "warnings": ["تحذيرات إن وجدت"]
}`,
    'final-prompt': `{
  "title": "...", "targetUse": "صورة | حركة", "prompt": "برومبت إنجليزي كامل مستقل", "negativePrompt": "negative terms", "notes": "ملاحظات بالعربية"
}`,
  }
  return `أعد JSON صالحًا فقط بهذا الشكل:\n${hints[stageId]}`
}

const STAGE_TASKS: Record<string, string> = {
  brief: `اكتب البرييف الإبداعي: الهدف، الرسالة الأساسية، الجمهور، ملاحظات المنصة، المخرجات المطلوبة، القيود والمخاطر. كن محددًا وقابلًا للتنفيذ، بلا عموميات.`,
  concept: `اقترح الفكرة الكبرى (Big Idea) واللوقلاين والخطاف الإبداعي والاستعارة البصرية وكلمات المزاج. الفكرة يجب أن تخدم البرييف حرفيًا وتكون قابلة للتنفيذ بالفيديو AI (لا تعتمد على إطلاق نار أو حركات مستحيلة التوليد).`,
  narrative: `اكتب السرد: بنية الفصول، سكربت مختصر بالمشاهد، نص التعليق الصوتي الكامل، ودعوة الفعل. إذا كان المشروع إعلانًا، اجعل السرد يدفع نحو المنتج بإيقاع تصاعدي.`,
  beats: `حوّل السرد إلى جدول Beats: قسّم المدة الكلية إلى beats (3–8 بحسب المدة) بثوانٍ محددة، لكل beat وظيفة وبصري وصوتي وانتقال. مجموع durations يجب أن يساوي totalDurationSeconds.`,
  'style-entities': `ثبّت الهوية البصرية: Style Lock (جملة حرفية طويلة تُنسخ كما هي في كل برومبت)، Style DNA (لوحة/إضاءة/ملمس/شخصية كاميرا/شخصية حركة)، Entity Ledger لكل كيان متكرر (شخصيات/منتج/أماكن) مع Identity String حرفي ثابت 25+ كلمة، وProduct Anchor إن وُجد منتج. هذه الأقفال ملزمة لكل المراحل التالية.`,
  storyboard: `ابنِ الستوري بورد: مشاهد مرتبة زمنيًا، كل مشهد له فريمات، لكل فريم: frameId ثابت (FR01...)، shotId، الدور، وصف بصري قابل للتخيل، المدة، حالة البداية والنهاية. عدد الفريمات يخدم القصة فقط. لا تكتب برومبتات هنا — هذا عمل المرحلة التالية.`,
  'shot-cards': `حوّل الستوري بورد إلى بطاقات لقطات: لكل shotId: المدة (من الستوري بورد)، الهدف، وصف الفريم، الكاميرا والعدسة، حركة الكاميرا، تلميح الصوت، والكيانات المستخدمة (entity IDs من الـLedger). التزم بالمدد والترتيب من الستوري بورد.`,
  'image-prompts': `اكتب برومبت صورة واحد كامل ومستقل لكل فريم في الستوري بورد، بالإنجليزية. كل برومبت يحتوي: Identity Strings للكيانات (انسخها حرفيًا من الـLedger)، Style Lock (انسخه حرفيًا)، التكوين، البيئة، الكاميرا/العدسة، الإضاءة، وقيود الجودة. ممنوع أي لغة تجميع مثل "use the text above". عدد البرومبتات = عدد الفريمات بالضبط. مصفوفة prompts مرتبة بترتيب الفريمات.`,
  'motion-prompts': `اكتب برومبت تحريك واحد كامل ومستقل لكل لقطة من بطاقات اللقطات، بالإنجليزية. كل برومبت يحتوي: فعل الموضوع، حركة الكاميرا، الإيقاع، تعليمات الاستمرارية (بما فيها أول/آخر فريم)، وإشارات صوتية. عدد البرومبتات = عدد اللقطات. لا تجعل المستخدم يجمع برومبت الصورة مع برومبت الحركة يدويًا — كل برومبت تحريك مستقل.`,
  audio: `اكتب خطة الصوت الكاملة: التعليق الصوتي (التوجيه + السكربت الكامل من مرحلة narrative)، الموسيقى (التوجيه/BPM/مرجع)، مؤثرات لكل beat، وملاحظات المكس. طابق أسماء الـbeats من جدول الإيقاع.`,
  delivery: `اكتب ملخص التسليم والجودة: مواصفات التصدير (الدقة/fps/الصيغة/النسبة/الحجم الأقصى) بحسب المنصة، بوابات الجودة (خصوصًا: اكتمال البرومبتات، تثبيت الهويات، مطابقة المدد، سلامة الاستمرارية) بحالة pass/warn/fail، قائمة فحص نهائية، وتحذيرات صريحة إن وُجدت.`,
  'final-prompt': `اكتب برومبت واحدًا نهائيًا كاملًا مستقلًا بالإنجليزية يلبي فكرة المستخدم مباشرة: الهوية إن لزم، التكوين، البيئة، الكاميرا، الإضاءة، الأسلوب، وقيود الجودة. أضف negativePrompt مفيدًا. الهدف: نسخه ولصقه في نموذج توليد الصور/الفيديو ويعمل دون تعديل.`,
}

export function buildStagePrompt(input: StagePromptInput): { system: string; task: string; schemaHint: string } {
  const engine = ENGINE_CONTEXT[input.route] || ENGINE_CONTEXT['full-production']
  const system = `${BASE_SYSTEM}\n\n${engine}`

  const segments = [intakeBlock(input.intake)]

  if (input.analysis) {
    segments.push(`## ملخص النية المعتمد
- المسار: ${input.route}
- السبب: ${input.analysis.routeReason}
- الملخص: ${input.analysis.summary}`)
  }

  const ctx = contextBlock(input.previousOutputs)
  if (ctx) segments.push(ctx)

  if (input.regenerateNote) {
    segments.push(`## ملاحظة إعادة التوليد (من المستخدم — أولوية عالية)
"${input.regenerateNote}"
أعد إنتاج هذه المرحلة فقط مع مراعاة الملاحظة، وحافظ على التوافق مع بقية المراحل المعتمدة.`)
  }

  segments.push(`## مهمتك الآن: مرحلة «${input.stageId}»\n${STAGE_TASKS[input.stageId] || 'نفّذ المرحلة وفق المنهجية.'}`)

  const task = segments.join('\n\n')
  return { system, task, schemaHint: jsonHintFor(input.stageId) }
}
