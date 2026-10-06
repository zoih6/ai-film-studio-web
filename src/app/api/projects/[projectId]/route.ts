// GET /api/projects/:id — قراءة المشروع والحالات | PATCH — تعديل بيانات intake
// PRD §12

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { patchProjectSchema } from '@/lib/validation/schemas'
import { apiError, makeRequestId, toProjectDetail } from '@/lib/api/respond'
import { rateLimit } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ projectId: string }> }

async function loadProject(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { stages: { orderBy: { updatedAt: 'asc' } } },
  })
  return project
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const requestId = makeRequestId()
  try {
    const { projectId } = await ctx.params
    const project = await loadProject(projectId)
    if (!project) {
      return apiError({ code: 'NOT_FOUND', message: 'المشروع غير موجود.' }, 404, requestId)
    }
    return NextResponse.json(toProjectDetail(project, project.stages))
  } catch (err) {
    console.error('[GET /api/projects/:id]', err)
    return apiError(
      { code: 'INTERNAL_ERROR', message: 'تعذر جلب المشروع.', retryable: true },
      500,
      requestId,
    )
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const requestId = makeRequestId()
  try {
    const { projectId } = await ctx.params
    const project = await loadProject(projectId)
    if (!project) {
      return apiError({ code: 'NOT_FOUND', message: 'المشروع غير موجود.' }, 404, requestId)
    }

    const ip = req.headers.get('x-forwarded-for') || 'local'
    const limit = rateLimit(`patch:${projectId}:${ip}`, 20, 60_000)
    if (!limit.ok) {
      return apiError(
        { code: 'RATE_LIMITED', message: 'طلبات كثيرة جدًا. انتظر قليلًا.', retryable: true },
        429,
        requestId,
      )
    }

    const body = await req.json().catch(() => null)
    const parsed = patchProjectSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(
        { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'بيانات غير صالحة.', retryable: false },
        400,
        requestId,
      )
    }

    // لا نسمح بتعديل المشروع أثناء التوليد الجاري
    if (project.status === 'generating') {
      return apiError(
        { code: 'PIPELINE_ERROR', message: 'لا يمكن تعديل المشروع أثناء التوليد. انتظر انتهاء المرحلة الحالية.', retryable: true },
        409,
        requestId,
      )
    }

    const { route, ...rest } = parsed.data
    const data: Record<string, unknown> = { ...rest }
    if (route) data.route = route

    // عند تغيير المسار نعيد ضبط المراحل إذا لم يبدأ التوليد
    if (route && route !== project.route && project.status === 'draft') {
      await db.projectStage.deleteMany({ where: { projectId } })
      data.status = 'draft'
    }

    const updated = await db.project.update({
      where: { id: projectId },
      data,
      include: { stages: { orderBy: { updatedAt: 'asc' } } },
    })
    return NextResponse.json(toProjectDetail(updated, updated.stages))
  } catch (err) {
    console.error('[PATCH /api/projects/:id]', err)
    return apiError({ code: 'INTERNAL_ERROR', message: 'تعذر تعديل المشروع.', retryable: true }, 500, requestId)
  }
}
