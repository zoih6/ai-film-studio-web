// POST /api/projects/:id/analyze — تحليل النية والتوجيه
// PRD §12 + §6 (مسار Intent Review)
// يستدعي المزود خلف الخادم لتحليل الفكرة واقتراح المسار والأسئلة الناقصة.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError, makeRequestId, toProjectDetail } from '@/lib/api/respond'
import { rateLimit } from '@/lib/security/rate-limit'
import { buildAnalysisPrompt, heuristicRoute, interpretAnalysis } from '@/lib/routing/intent-router'
import { getProviderAsync } from '@/lib/ai/provider-factory'
import { parseModelJson } from '@/lib/ai/output-parser'
import type { IntentAnalysis, ProjectType } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

type Ctx = { params: Promise<{ projectId: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const requestId = makeRequestId()
  try {
    const { projectId } = await ctx.params
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { stages: true },
    })
    if (!project) {
      return apiError({ code: 'NOT_FOUND', message: 'المشروع غير موجود.' }, 404, requestId)
    }

    const ip = req.headers.get('x-forwarded-for') || 'local'
    const limit = rateLimit(`analyze:${projectId}:${ip}`, 8, 60_000)
    if (!limit.ok) {
      return apiError(
        { code: 'RATE_LIMITED', message: 'طلبات تحليل كثيرة. انتظر قليلًا ثم أعد المحاولة.', retryable: true },
        429,
        requestId,
      )
    }

    // تعديلات اختيارية قبل التحليل (قد يعدّل المستخدم النوع/المنصة)
    const body = await req.json().catch(() => ({}))
    const overrides = (body || {}) as {
      projectType?: string
      platform?: string
      durationSeconds?: number
      aspectRatio?: string
      tone?: string
    }
    if (overrides.projectType) {
      await db.project.update({ where: { id: projectId }, data: { projectType: overrides.projectType } })
    }

    await db.project.update({ where: { id: projectId }, data: { status: 'analyzing' } })

    const intake = {
      idea: project.idea,
      projectType: (overrides.projectType || project.projectType) as ProjectType,
      platform: overrides.platform || project.platform,
      durationSeconds: overrides.durationSeconds || project.durationSeconds,
      aspectRatio: overrides.aspectRatio || project.aspectRatio,
      language: project.language,
      tone: overrides.tone || project.tone,
      targetAudience: project.targetAudience,
      notes: project.notes,
    }

    try {
      const provider = await getProviderAsync()
      const { system, task, schemaHint } = buildAnalysisPrompt(intake)
      const result = await provider.generate({
        system,
        task,
        jsonSchemaHint: schemaHint,
        temperature: 0.3,
        maxTokens: 4096,
      })

      const raw = parseModelJson(result.text)
      const analysis: IntentAnalysis = interpretAnalysis(raw, intake)

      const updated = await db.project.update({
        where: { id: projectId },
        data: {
          analysis: analysis as unknown as object,
          route: analysis.suggestedRoute,
          routeReason: analysis.routeReason,
          status: 'review',
          // تقريب القيم المستنتجة في الحقول الفارغة فقط
          platform: project.platform || analysis.inferred.platform || null,
          durationSeconds:
            project.durationSeconds || analysis.inferred.durationSeconds || null,
          aspectRatio: project.aspectRatio || analysis.inferred.aspectRatio || null,
          tone: project.tone || analysis.inferred.tone || null,
          targetAudience: project.targetAudience || analysis.inferred.targetAudience || null,
        },
        include: { stages: true },
      })

      return NextResponse.json({
        project: toProjectDetail(updated, updated.stages),
        analysis,
      })
    } catch (aiErr) {
      // فشل التحليل: نرجع للتوجيه الاستنتاجي حتى لا يعلق المستخدم — مع تسجيل السبب داخليًا
      const heur = heuristicRoute(intake)
      console.error('[analyze] AI fallback to heuristic:', aiErr instanceof Error ? aiErr.message : aiErr)
      const analysis: IntentAnalysis = {
        intent: 'إنتاج فيديو من فكرة المستخدم',
        scope: heur.route === 'shortcut-prompt' ? 'prompt_only' : 'full_project',
        suggestedType: heur.type,
        suggestedRoute: heur.route,
        routeReason: heur.reason,
        summary: project.idea.slice(0, 200),
        missingInfo: [],
        inferred: {},
      }
      const updated = await db.project.update({
        where: { id: projectId },
        data: {
          analysis: analysis as unknown as object,
          route: analysis.suggestedRoute,
          routeReason: analysis.routeReason,
          status: 'review',
        },
        include: { stages: true },
      })
      return NextResponse.json({
        project: toProjectDetail(updated, updated.stages),
        analysis,
        warning: 'تم استخدام التوجيه السريع بدل تحليل AI (المزود غير متاح حاليًا من هذه البيئة).',
      })
    }
  } catch (err) {
    console.error('[POST /api/projects/:id/analyze]', err)
    return apiError(
      { code: 'INTERNAL_ERROR', message: 'حدث خطأ داخلي أثناء تحليل الفكرة.', retryable: true },
      500,
      requestId,
    )
  }
}
