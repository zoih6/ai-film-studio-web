// GET /api/projects/:id/events — أحداث Progress (polling مضبوط)
// PRD §12: أحداث Progress، SSE أو polling مضبوط — نعتمد polling بسيط مستقر.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError, makeRequestId, toStageResult } from '@/lib/api/respond'
import { stagesForRoute } from '@/lib/domain/stages'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ projectId: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
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

    const order = stagesForRoute(project.route || 'full-production')
    const events = order.map((sid) => {
      const rec = project.stages.find((s) => s.stageId === sid)
      return rec ? toStageResult(rec) : { stageId: sid, status: 'pending' as const, version: 0, updatedAt: project.updatedAt.toISOString(), error: null }
    })

    return NextResponse.json(
      {
        projectId,
        projectStatus: project.status,
        currentStage: project.currentStage,
        events,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[GET events]', err)
    return apiError({ code: 'INTERNAL_ERROR', message: 'تعذر جلب الأحداث.', retryable: true }, 500, requestId)
  }
}
