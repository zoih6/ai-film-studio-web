// POST /api/projects/:id/generate — بدء Pipeline أو مرحلة محددة
// PRD §12 + FILE-STRUCTURE.md
// تصميم serverless-آمن: كل استدعاء يولّد مرحلة واحدة ويعيد حالة المشروع،
// والعميل يحرّك تسلسل المراحل. لا مهام خلفية طويلة الأمد.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError, makeRequestId, toProjectDetail } from '@/lib/api/respond'
import { rateLimit } from '@/lib/security/rate-limit'
import { runStageForProject, nextPendingStage } from '@/lib/ai/pipeline'
import { stagesForRoute } from '@/lib/domain/stages'

export const runtime = 'nodejs'
export const maxDuration = 120

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
    const limit = rateLimit(`generate:${projectId}:${ip}`, 40, 60_000)
    if (!limit.ok) {
      return apiError(
        { code: 'RATE_LIMITED', message: 'طلبات توليد كثيرة. انتظر قليلًا.', retryable: true },
        429,
        requestId,
      )
    }

    // يجب أن يكون المشروع قد تم تحليله/اعتماده قبل التوليد
    if (project.status === 'draft' || project.status === 'analyzing') {
      return apiError(
        { code: 'PIPELINE_ERROR', message: 'حلّل الفكرة واعتمد الاتجاه أولًا قبل بدء التوليد.', retryable: false },
        409,
        requestId,
      )
    }

    const body = await req.json().catch(() => ({}))
    const requestedStage = (body || {}).stageId as string | undefined

    const order = stagesForRoute(project.route || 'full-production')
    let stageId: string

    if (requestedStage) {
      // إعادة توليد مرحلة محددة مسموحة عبر هذا المسار أيضًا (نفس عقد regenerate)
      if (!order.includes(requestedStage)) {
        return apiError(
          { code: 'PIPELINE_ERROR', message: 'هذه المرحلة ليست ضمن مسار المشروع.', retryable: false },
          400,
          requestId,
        )
      }
      stageId = requestedStage
    } else {
      const next = await nextPendingStage(projectId)
      if (!next) {
        return NextResponse.json({
          project: toProjectDetail(project, project.stages),
          stage: null,
          done: true,
        })
      }
      stageId = next
    }

    const outcome = await runStageForProject(projectId, stageId, {
      regenerateNote: (body || {}).note as string | undefined,
    })

    const fresh = await db.project.findUnique({
      where: { id: projectId },
      include: { stages: true },
    })
    if (!fresh) {
      return apiError({ code: 'NOT_FOUND', message: 'المشروع غير موجود.' }, 404, requestId)
    }

    return NextResponse.json({
      project: toProjectDetail(fresh, fresh.stages),
      stage: outcome.stageId,
      status: outcome.status,
      error: outcome.error || null,
      done: false,
    })
  } catch (err) {
    console.error('[POST /api/projects/:id/generate]', err)
    return apiError(
      { code: 'INTERNAL_ERROR', message: 'حدث خطأ داخلي أثناء التوليد.', retryable: true },
      500,
      requestId,
    )
  }
}
