// Pipeline Orchestrator — تنفيذ المراحل بالترتيب مع سياق تدريجي وحفظ الإصدارات.
// المصدر: PRD §8 (FR-04/05/07) + FILE-STRUCTURE.md §4
// قاعدة: لا تنتقل للمرحلة التالية إذا فشلت الحالية، ولا تعيد توليد المشروع كله.

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import type { IntentAnalysis, ProjectType } from '@/types'
import { getProviderAsync } from './provider-factory'
import { buildStagePrompt } from './prompts'
import { parseModelJson, validateStageOutput } from './output-parser'
import { getStageSchema } from '@/lib/validation/schemas'
import { stagesForRoute } from '@/lib/domain/stages'
import type { IntakeContext } from '@/lib/routing/intent-router'

// قيمة null الصحيحة لحقول JSON في Prisma
const dbNull = (): typeof Prisma.DbNull => Prisma.DbNull

export interface RunStageOutcome {
  stageId: string
  status: 'completed' | 'failed'
  output?: unknown
  error?: { code: string; message: string; retryable: boolean }
}

function intakeFromProject(project: {
  idea: string
  projectType: string
  platform?: string | null
  durationSeconds?: number | null
  aspectRatio?: string | null
  language: string
  tone?: string | null
  targetAudience?: string | null
  preferredModel?: string | null
  visualStyle?: string | null
  notes?: string | null
}): IntakeContext {
  return {
    idea: project.idea,
    projectType: project.projectType as ProjectType,
    platform: project.platform,
    durationSeconds: project.durationSeconds,
    aspectRatio: project.aspectRatio,
    language: project.language,
    tone: project.tone,
    targetAudience: project.targetAudience,
    preferredModel: project.preferredModel,
    visualStyle: project.visualStyle,
    notes: project.notes,
  }
}

export async function runStageForProject(
  projectId: string,
  stageId: string,
  opts: { regenerateNote?: string } = {},
): Promise<RunStageOutcome> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { stages: true },
  })
  if (!project) throw new Error('Project not found')

  // ترتيب المراحل لهذا المسار
  const order = stagesForRoute(project.route || 'full-production')
  if (!order.includes(stageId)) {
    return {
      stageId,
      status: 'failed',
      error: { code: 'PIPELINE_ERROR', message: 'هذه المرحلة ليست ضمن مسار المشروع.', retryable: false },
    }
  }

  // المراحل السابقة المعتمدة = سياق المرحلة الحالية
  const previousOutputs: Record<string, unknown> = {}
  for (const prevId of order.slice(0, order.indexOf(stageId))) {
    const stage = project.stages.find((s) => s.stageId === prevId && s.id === undefined ? false : s.stageId === prevId)
    const record = project.stages.filter((s) => s.stageId === prevId).sort((a, b) => b.version - a.version)[0]
    if (record && (record.status === 'completed' || record.status === 'approved') && record.output) {
      previousOutputs[prevId] = record.output
    } else {
      // بوابة: مرحلة سابقة غير مكتملة — لا يجوز التنفيذ
      return {
        stageId,
        status: 'failed',
        error: {
          code: 'PIPELINE_ERROR',
          message: `يجب إكمال مرحلة «${prevId}» أولًا قبل هذه المرحلة.`,
          retryable: false,
        },
      }
    }
  }

  const stageRecord = project.stages.find((s) => s.stageId === stageId)
  const nextVersion = (stageRecord?.version || 0) + 1

  // وضع running
  await db.projectStage.upsert({
    where: { projectId_stageId: { projectId, stageId } },
    create: { projectId, stageId, status: 'running', version: nextVersion },
    update: { status: 'running', version: nextVersion, error: dbNull(), updatedAt: new Date() },
  })
  await db.project.update({
    where: { id: projectId },
    data: { status: 'generating', currentStage: stageId, updatedAt: new Date() },
  })

  try {
    const provider = await getProviderAsync()
    const { system, task, schemaHint } = buildStagePrompt({
      stageId,
      intake: intakeFromProject(project),
      analysis: (project.analysis as unknown as IntentAnalysis) || null,
      route: project.route || 'full-production',
      previousOutputs,
      regenerateNote: opts.regenerateNote,
    })

    // توليد + سياسة PRD §10: عند فشل parsing أعد المحاولة مرة واحدة فقط
    let output: unknown
    for (let attempt = 1; attempt <= 2; attempt++) {
      const result = await provider.generate({
        system,
        task:
          attempt === 1
            ? task
            : `${task}\n\nملاحظة إلزامية: محاولتك السابقة لم تكن JSON صالحًا. أعد الإخراج بصيغة JSON صالحة صرفة فقط، بلا أي نص أو أسوار markdown قبله أو بعده.`,
        jsonSchemaHint: schemaHint,
        temperature: attempt === 1 ? 0.65 : 0.4,
        maxTokens: 16384,
      })

      try {
        const rawJson = parseModelJson(result.text)
        const schema = getStageSchema(stageId)
        output = schema ? validateStageOutput(stageId, schema, rawJson) : rawJson
        break
      } catch (parseErr) {
        if (attempt === 2) throw parseErr
        console.error(
          `[pipeline] ${stageId}: محاولة تحليل فاشلة (1/2) — سيُعاد التوليد مرة واحدة.`,
          parseErr instanceof Error ? parseErr.message : parseErr,
        )
      }
    }

    // حفظ الناتج + إصدار

    await db.projectStage.update({
      where: { projectId_stageId: { projectId, stageId } },
      data: { status: 'completed', output: output as object, error: dbNull(), updatedAt: new Date() },
    })
    const updated = await db.projectStage.findUnique({
      where: { projectId_stageId: { projectId, stageId } },
    })
    if (updated) {
      await db.stageVersion.create({
        data: {
          projectStageId: updated.id,
          version: nextVersion,
          output: output as object,
          note: opts.regenerateNote || null,
          provider: provider.name,
        },
      })
    }

    // هل اكتملت كل المراحل؟
    const allStages = await db.projectStage.findMany({ where: { projectId } })
    const allDone = order.every((sid) => {
      const rec = allStages.find((s) => s.stageId === sid)
      return rec && (rec.status === 'completed' || rec.status === 'approved')
    })
    const nextStage = order.find((sid) => {
      const rec = allStages.find((s) => s.stageId === sid)
      return !rec || (rec.status !== 'completed' && rec.status !== 'approved')
    })
    await db.project.update({
      where: { id: projectId },
      data: {
        status: allDone ? 'completed' : 'generating',
        currentStage: nextStage || stageId,
        updatedAt: new Date(),
      },
    })

    return { stageId, status: 'completed', output }
  } catch (err) {
    const code = (err as { code?: string }).code || 'AI_PROVIDER_ERROR'
    const message = err instanceof Error ? err.message : 'خطأ غير معروف أثناء توليد المرحلة.'
    const retryable = (err as { retryable?: boolean }).retryable ?? true

    await db.projectStage.update({
      where: { projectId_stageId: { projectId, stageId } },
      data: {
        status: 'failed',
        error: { code, message, retryable } as object,
        updatedAt: new Date(),
      },
    })
    // المشروع لا يفشل كليًا — تبقى بقية المراحل كما هي ويمكن إعادة المحاولة للمرحلة الفاشلة فقط
    await db.project.update({
      where: { id: projectId },
      data: { status: 'generating', updatedAt: new Date() },
    })

    return { stageId, status: 'failed', error: { code, message, retryable } }
  }
}

// المرحلة التالية المعلقة لمشروع
export async function nextPendingStage(projectId: string): Promise<string | null> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { stages: true },
  })
  if (!project) return null
  const order = stagesForRoute(project.route || 'full-production')
  for (const sid of order) {
    const rec = project.stages.find((s) => s.stageId === sid)
    if (!rec || (rec.status !== 'completed' && rec.status !== 'approved')) return sid
  }
  return null
}
