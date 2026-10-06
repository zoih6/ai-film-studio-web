// عقود التحقق من المدخلات والمخرجات — Zod
// المصدر: PRD §10 (Structured output) + schemas/ في المستودع المصدر

import { z } from 'zod'

// ---------- Intake ----------

export const projectTypeSchema = z.enum([
  'auto',
  'commercial',
  'documentary',
  'film',
  'motion',
  'series',
  'prompt',
])

export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  idea: z
    .string()
    .trim()
    .min(10, 'اكتب فكرة لا تقل عن 10 أحرف.')
    .max(4000, 'الفكرة طويلة جدًا. اختصرها إلى 4000 حرف.'),
  projectType: projectTypeSchema.default('auto'),
  platform: z.string().trim().max(60).optional(),
  durationSeconds: z.number().int().min(3).max(1800).optional(),
  aspectRatio: z.string().trim().max(10).optional(),
  language: z.string().trim().max(10).default('ar'),
  tone: z.string().trim().max(120).optional(),
  targetAudience: z.string().trim().max(200).optional(),
  preferredModel: z.string().trim().max(60).optional(),
  visualStyle: z.string().trim().max(400).optional(),
  notes: z.string().trim().max(2000).optional(),
})

export const patchProjectSchema = createProjectSchema.partial().extend({
  route: z.string().trim().max(60).optional(),
})

// ---------- Intent Analysis ----------

export const intentAnalysisSchema = z.object({
  intent: z.string().min(1),
  scope: z.enum(['single_shot', 'scene', 'full_project', 'prompt_only']),
  suggestedType: projectTypeSchema,
  suggestedRoute: z.enum([
    'shortcut-prompt',
    'commercial-engine',
    'documentary-engine',
    'full-production',
    'motion-engine',
    'series-engine',
  ]),
  routeReason: z.string().min(1),
  summary: z.string().min(1),
  missingInfo: z.array(z.string()).default([]),
  inferred: z
    .object({
      platform: z.string().optional(),
      durationSeconds: z.number().optional(),
      aspectRatio: z.string().optional(),
      tone: z.string().optional(),
      language: z.string().optional(),
      targetAudience: z.string().optional(),
    })
    .default({}),
})

// ---------- Stage Outputs ----------

export const briefOutputSchema = z.object({
  title: z.string().min(1),
  objective: z.string().min(1),
  keyMessage: z.string().min(1),
  audience: z.string().min(1),
  platformNotes: z.string().min(1),
  deliverables: z.array(z.string()).min(1),
  constraints: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
})

export const conceptOutputSchema = z.object({
  bigIdea: z.string().min(1),
  logline: z.string().min(1),
  hook: z.string().min(1),
  visualMetaphor: z.string().min(1),
  moodKeywords: z.array(z.string()).min(3),
  toneNotes: z.string().min(1),
})

export const narrativeOutputSchema = z.object({
  structure: z.array(z.string()).min(1),
  script: z.string().min(1),
  voiceover: z.string().min(1),
  cta: z.string().optional().default(''),
})

export const beatsOutputSchema = z.object({
  totalDurationSeconds: z.number().int().min(3),
  beats: z
    .array(
      z.object({
        id: z.string().min(1),
        purpose: z.string().min(1),
        startSeconds: z.number().min(0),
        durationSeconds: z.number().min(1),
        visual: z.string().min(1),
        audio: z.string().min(1),
        transition: z.string().min(1),
      }),
    )
    .min(1),
})

export const styleEntitiesOutputSchema = z.object({
  styleLock: z.string().min(40, 'Style Lock يجب أن يكون جملة حرفية طويلة قابلة لإعادة الاستخدام.'),
  styleDna: z.object({
    palette: z.array(z.string()).min(2),
    lighting: z.string().min(1),
    texture: z.string().min(1),
    cameraCharacter: z.string().min(1),
    motionCharacter: z.string().min(1),
  }),
  entities: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        kind: z.enum(['character', 'product', 'location', 'prop', 'style']),
        identityString: z.string().min(20),
        notes: z.string().default(''),
      }),
    )
    .default([]),
  productAnchor: z.string().optional(),
})

export const storyboardOutputSchema = z.object({
  aspectRatio: z.string().min(1),
  totalDurationSeconds: z.number().int().min(3),
  scenes: z
    .array(
      z.object({
        sceneId: z.string().min(1),
        title: z.string().min(1),
        purpose: z.string().min(1),
        frames: z
          .array(
            z.object({
              frameId: z.string().min(1),
              shotId: z.string().min(1),
              role: z.string().min(1),
              visualDescription: z.string().min(1),
              durationSeconds: z.number().min(1),
              startState: z.string().min(1),
              endState: z.string().min(1),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
})

export const shotCardsOutputSchema = z.object({
  shots: z
    .array(
      z.object({
        shotId: z.string().min(1),
        frameId: z.string().min(1),
        durationSeconds: z.number().min(1),
        goal: z.string().min(1),
        frameDescription: z.string().min(1),
        camera: z.string().min(1),
        movement: z.string().min(1),
        audioHint: z.string().min(1),
        references: z.string().default('none'),
      }),
    )
    .min(1),
})

export const imagePromptsOutputSchema = z.object({
  targetModel: z.string().default('any'),
  prompts: z
    .array(
      z.object({
        frameId: z.string().min(1),
        shotId: z.string().min(1),
        title: z.string().min(1),
        prompt: z.string().min(60, 'البرومبت يجب أن يكون كتلة كاملة ومفصلة.'),
      }),
    )
    .min(1),
})

export const motionPromptsOutputSchema = z.object({
  targetModel: z.string().default('any'),
  prompts: z
    .array(
      z.object({
        shotId: z.string().min(1),
        title: z.string().min(1),
        durationSeconds: z.number().min(1),
        prompt: z.string().min(60),
        firstFrameRole: z.string().min(1),
        lastFrameRole: z.string().min(1),
      }),
    )
    .min(1),
})

export const audioOutputSchema = z.object({
  voiceover: z.object({
    direction: z.string().min(1),
    language: z.string().min(1),
    fullScript: z.string().min(1),
  }),
  music: z.object({
    direction: z.string().min(1),
    bpm: z.union([z.string(), z.number()]).catch('').transform((v) => String(v ?? '')),
    reference: z.string().catch(''),
  }),
  sfx: z.array(z.object({ beat: z.string(), sound: z.string() })).default([]),
  mixNotes: z.string().min(1),
})

export const deliveryOutputSchema = z.object({
  exportSpecs: z.object({
    resolution: z.string().min(1),
    fps: z.string().min(1),
    format: z.string().min(1),
    aspectRatio: z.string().min(1),
    maxFileSizeMb: z.string().default(''),
  }),
  qualityGates: z
    .array(z.object({ gate: z.string().min(1), status: z.enum(['pass', 'warn', 'fail']), note: z.string().default('') }))
    .min(1),
  checklist: z.array(z.string()).min(1),
  warnings: z.array(z.string()).default([]),
})

export const finalPromptOutputSchema = z.object({
  title: z.string().min(1),
  targetUse: z.string().min(1),
  prompt: z.string().min(60, 'البرومبت يجب أن يكون كتلة كاملة.'),
  negativePrompt: z.string().default(''),
  notes: z.string().default(''),
})

// خريطة المرحلة → المخطط
export const STAGE_OUTPUT_SCHEMAS: Record<string, z.ZodTypeAny> = {
  brief: briefOutputSchema,
  concept: conceptOutputSchema,
  narrative: narrativeOutputSchema,
  beats: beatsOutputSchema,
  'style-entities': styleEntitiesOutputSchema,
  storyboard: storyboardOutputSchema,
  'shot-cards': shotCardsOutputSchema,
  'image-prompts': imagePromptsOutputSchema,
  'motion-prompts': motionPromptsOutputSchema,
  audio: audioOutputSchema,
  delivery: deliveryOutputSchema,
  'final-prompt': finalPromptOutputSchema,
}

export function getStageSchema(stageId: string): z.ZodTypeAny | undefined {
  return STAGE_OUTPUT_SCHEMAS[stageId]
}
