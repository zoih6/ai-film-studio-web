// POST /api/projects/:id/stages/:stageId/regenerate — إعادة توليد مرحلة مع حفظ النسخة السابقة
// PRD §8 (FR-07 التحرير والنسخ): إعادة التوليد تحتاج سببًا أو ملاحظة

import { NextRequest, NextResponse } from 'next/server'
import { db, syncStateAfterWrite, refreshStateFromBlob } from '@/lib/db'
import { apiError, makeRequestId, toProjectDetail } from '@/lib/api/respond'
import { rateLimit } from '@/lib/security/rate-limit'
import { runStageForProject } from '@/lib/ai/pipeline'
import { stagesForRoute } from '@/lib/domain/stages'

export const runtime = 'nodejs'
export const maxDuration = 60

type Ctx = { params: Promise<{ projectId: string; stageId: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const requestId = makeRequestId()
  try {
    const { projectId, stageId } = await ctx.params
    await refreshStateFromBlob()
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { stages: true },
    })
    if (!project) {
      return apiError({ code: 'NOT_FOUND', message: 'المشروع غير موجود.' }, 404, requestId)
    }

    const order = stagesForRoute(project.route || 'full-production')
    if (!order.includes(stageId)) {
      return apiError(
        { code: 'PIPELINE_ERROR', message: 'هذه المرحلة ليست ضمن مسار المشروع.', retryable: false },
        400,
        requestId,
      )
    }

    const ip = req.headers.get('x-forwarded-for') || 'local'
    const limit = rateLimit(`regen:${projectId}:${ip}`, 12, 60_000)
    if (!limit.ok) {
      return apiError(
        { code: 'RATE_LIMITED', message: 'طلبات إعادة توليد كثيرة. انتظر قليلًا.', retryable: true },
        429,
        requestId,
      )
    }

    const body = await req.json().catch(() => ({}))
    const note = ((body || {}).note || '').toString().trim()
    if (note.length < 3) {
      return apiError(
        { code: 'VALIDATION_ERROR', message: 'اكتب سببًا أو ملاحظة قصيرة لإعادة التوليد (3 أحرف على الأقل).', retryable: false },
        400,
        requestId,
      )
    }

    const outcome = await runStageForProject(projectId, stageId, { regenerateNote: note })
    await syncStateAfterWrite()

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
    })
  } catch (err) {
    console.error('[POST regenerate]', err)
    return apiError(
      { code: 'INTERNAL_ERROR', message: 'حدث خطأ داخلي أثناء إعادة التوليد.', retryable: true },
      500,
      requestId,
    )
  }
}
