# AI Film Studio Web — Architecture & File Structure

هذه الوثيقة تحدد أين يعيش كل جزء من تطبيق الويب. الغرض منها منع بناء تطبيق كبير في ملف واحد، وفصل واجهة المستخدم عن منطق AI ومراجع AI Film Studio.

## 1. الهيكل المقترح

```text
ai-film-studio/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (marketing)/
│       │   │   ├── page.tsx                    # الصفحة الرئيسية
│       │   │   └── layout.tsx
│       │   ├── projects/
│       │   │   ├── new/page.tsx                # Intake وإنشاء مشروع
│       │   │   └── [projectId]/
│       │   │       ├── page.tsx                 # Workspace
│       │   │       ├── layout.tsx
│       │   │       ├── stages/[stageId]/page.tsx
│       │   │       ├── storyboard/page.tsx
│       │   │       ├── prompts/page.tsx
│       │   │       └── export/page.tsx
│       │   ├── api/
│       │   │   ├── projects/route.ts
│       │   │   ├── projects/[projectId]/route.ts
│       │   │   ├── projects/[projectId]/analyze/route.ts
│       │   │   ├── projects/[projectId]/generate/route.ts
│       │   │   ├── projects/[projectId]/stages/[stageId]/regenerate/route.ts
│       │   │   ├── projects/[projectId]/stages/[stageId]/approve/route.ts
│       │   │   ├── projects/[projectId]/events/route.ts
│       │   │   └── projects/[projectId]/export/route.ts
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── manus-routes.json
│       ├── components/
│       │   ├── ui/                              # Primitive UI components
│       │   ├── brand/                           # Logo, wordmark, app shell
│       │   ├── marketing/                       # Landing components
│       │   ├── intake/                          # Idea input and project options
│       │   ├── workspace/                       # Sidebar, header, stage nav
│       │   ├── stages/                          # Stage-specific renderers
│       │   │   ├── BriefStage.tsx
│       │   │   ├── ConceptStage.tsx
│       │   │   ├── BeatsStage.tsx
│       │   │   ├── StoryboardStage.tsx
│       │   │   ├── ShotCardsStage.tsx
│       │   │   ├── ImagePromptsStage.tsx
│       │   │   ├── MotionPromptsStage.tsx
│       │   │   ├── AudioStage.tsx
│       │   │   └── DeliveryStage.tsx
│       │   ├── prompts/                         # Copy/edit/regenerate blocks
│       │   ├── storyboard/                      # Shot cards and frame views
│       │   ├── progress/                        # Pipeline timeline and statuses
│       │   └── export/                          # Export dialogs and summaries
│       ├── lib/
│       │   ├── api/                             # Server/client API helpers
│       │   ├── ai/
│       │   │   ├── provider.ts                   # AIProvider interface
│       │   │   ├── gemini-provider.ts            # Gemini adapter
│       │   │   ├── prompts.ts                    # System/task prompt builders
│       │   │   ├── context-loader.ts             # Progressive reference loading
│       │   │   ├── output-parser.ts              # JSON parse + repair policy
│       │   │   └── generation-pipeline.ts        # Stage orchestration
│       │   ├── routing/
│       │   │   ├── intent-router.ts              # Project type -> route
│       │   │   └── route-definitions.ts
│       │   ├── domain/
│       │   │   ├── project.ts
│       │   │   ├── stages.ts
│       │   │   ├── artifacts.ts
│       │   │   └── versions.ts
│       │   ├── validation/
│       │   │   ├── intake-schema.ts
│       │   │   ├── stage-schemas.ts
│       │   │   └── error-envelope.ts
│       │   ├── export/
│       │   │   ├── markdown-export.ts
│       │   │   └── json-export.ts
│       │   ├── security/
│       │   │   ├── env.ts
│       │   │   ├── rate-limit.ts
│       │   │   └── sanitize.ts
│       │   └── utils/
│       ├── hooks/
│       │   ├── use-project.ts
│       │   ├── use-generation-events.ts
│       │   └── use-copy-to-clipboard.ts
│       ├── store/
│       │   ├── project-store.ts
│       │   └── ui-store.ts
│       ├── types/
│       │   ├── api.ts
│       │   ├── ai.ts
│       │   └── project.ts
│       ├── public/
│       │   ├── brand/
│       │   └── manus-routes.json
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── fixtures/
│       ├── .env.example
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── packages/
│   ├── contracts/
│   │   ├── src/project.ts
│   │   ├── src/stages.ts
│   │   ├── src/artifacts.ts
│   │   └── src/index.ts
│   ├── design-system/
│   │   ├── tokens.ts
│   │   └── README.md
│   └── ai-film-core/
│       ├── src/router.ts
│       ├── src/pipeline.ts
│       ├── src/schemas.ts
│       └── README.md
├── references/
│   └── ai-film-studio/                          # نسخة runtime من مراجع المستودع
│       ├── workflows/
│       ├── references/
│       ├── schemas/
│       ├── styles/
│       └── quality/
├── docs/
│   └── product/
│       ├── PRD.md
│       ├── FILE-STRUCTURE.md
│       └── AGENT-HANDOFF.md
├── package.json                                 # إن اختار الوكيل monorepo
└── README.md
```

## 2. حدود المسؤوليات

| المنطقة | المسؤولية | لا تضع فيها |
|---|---|---|
| `app/` | Routes وServer boundaries | منطق Prompt طويل |
| `components/` | العرض والتفاعل | استدعاء Gemini مباشرة |
| `lib/ai/` | Provider وPipeline وContext | React UI |
| `lib/routing/` | اختيار أصغر Workflow | مفاتيح API |
| `lib/validation/` | التحقق من المدخلات والمخرجات | تنسيق بصري |
| `packages/contracts/` | Types وSchemas المشتركة | تفاصيل provider |
| `references/` | ملفات AI Film Studio المرجعية | Secrets أو user data |
| `tests/` | Unit/Integration fixtures | بيانات مستخدم حقيقية |

## 3. قرار monorepo

- إذا كان التطبيق واحدًا فقط، يمكن بدء العمل داخل `apps/web/` أو جذر Web بسيط.
- لا تُنشئ packages منفصلة إلا إذا كان هناك كود مشترك فعلي بين Web وWorker أو CLI.
- يجب أن تبقى `docs/product/` في الجذر حتى يقرأها وكيل التنفيذ.
- يجب ألا تنسخ كامل المستودع داخل client bundle. مراجع AI تُقرأ server-side أو تُحوّل إلى Context محدود.

## 4. تنظيم مراحل الـPipeline

```text
intake
  -> intent-analysis
  -> route-selection
  -> brief
  -> concept
  -> narrative
  -> beats
  -> style-and-entities
  -> storyboard
  -> shot-cards
  -> image-prompts
  -> motion-prompts
  -> audio
  -> delivery-and-quality
```

كل مرحلة يجب أن تكون دالة نقية قدر الإمكان:

```ts
runStage({
  projectState,
  stageId,
  provider,
  references,
}): Promise<StageResult>
```

ولا يجوز أن تعتمد مرحلة على قراءة state عالمي غير موثق.

## 5. مصدر الحقيقة

- المنتج والسلوك: `docs/product/PRD.md`.
- مسار الملفات: `docs/product/FILE-STRUCTURE.md`.
- تعليمات تسليم الوكيل: `docs/product/AGENT-HANDOFF.md`.
- منطق AI Film Studio: `SKILL.md` ثم `workflows/intent-router.md`.
- عقود المخرجات: `schemas/`.
- الجودة: `quality/` و`scripts/`.

## 6. قواعد التشغيل

- جميع استدعاءات AI من Server.
- لا تعتبر نتيجة النموذج صالحة قبل Schema validation.
- لا تنتقل تلقائيًا إلى المرحلة التالية إذا فشلت المرحلة الحالية.
- لا تعيد توليد كل المشروع عند تعديل مرحلة واحدة.
- احتفظ بنسخة output لكل إصدار.
- اجعل `manus-routes.json` يعكس جميع الصفحات الفعلية.
- استخدم `loading`, `empty`, `error`, `success` states لكل شاشة أساسية.
