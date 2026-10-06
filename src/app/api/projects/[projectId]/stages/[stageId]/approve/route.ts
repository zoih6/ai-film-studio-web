// POST /api/projects/:id/stages/:stageId/approve — اعتماد مرحلة
// PRD §8 (FR-04): status لكل مرحلة: pending, running, completed, failed, approved

import { NextRequest, NextResponse } from 'next/server'
import { db, syncStateAfterWrite, refreshStateFromBlob } from '@/lib/db'
import { apiError, makeRequestId, toProjectDetail } from '@/lib/api/respond'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ projectId: string; stageId: string }> }

export async function POST(_req: NextRequest, ctx: Ctx) {
  const requestId = makeRequestId()
  try {
    const { projectId, stageId } = await ctx.params
    await refreshStateFromBlob()
    const stage = await db.projectStage.findUnique({
      where: { projectId_stageId: { projectId, stageId } },
    })
    if (!stage) {
      return apiError(
        { code: 'NOT_FOUND', message: 'المرحلة غير موجودة بعد لهذا المشروع.' },
        404,
        requestId,
      )
    }
    if (stage.status !== 'completed' && stage.status !== 'approved') {
      return apiError(
        { code: 'PIPELINE_ERROR', message: 'لا يمكن اعتماد مرحلة غير مكتملة.', retryable: false },
        409,
        requestId,
      )
    }

    await db.projectStage.update({
      where: { projectId_stageId: { projectId, stageId } },
      data: { status: 'approved', updatedAt: new Date() },
    })
    await syncStateAfterWrite()

    const fresh = await db.project.findUnique({
      where: { id: projectId },
      include: { stages: true },
    })
    if (!fresh) {
      return apiError({ code: 'NOT_FOUND', message: 'المشروع غير موجود.' }, 404, requestId)
    }
    return NextResponse.json(toProjectDetail(fresh, fresh.stages))
  } catch (err) {
    console.error('[POST approve]', err)
    return apiError({ code: 'INTERNAL_ERROR', message: 'تعذر اعتماد المرحلة.', retryable: true }, 500, requestId)
  }
}
