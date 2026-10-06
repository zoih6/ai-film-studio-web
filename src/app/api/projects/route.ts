// POST /api/projects — إنشاء مشروع | GET /api/projects — قائمة المشاريع
// PRD §12: API / Server Contracts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createProjectSchema } from '@/lib/validation/schemas'
import { apiError, makeRequestId, toProjectSummary } from '@/lib/api/respond'
import { rateLimit } from '@/lib/security/rate-limit'
import { heuristicRoute } from '@/lib/routing/intent-router'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const requestId = makeRequestId()
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local'
    const limit = rateLimit(`create:${ip}`, 12, 60_000)
    if (!limit.ok) {
      return apiError(
        { code: 'RATE_LIMITED', message: 'طلبات كثيرة جدًا. انتظر قليلًا ثم أعد المحاولة.', retryable: true },
        429,
        requestId,
      )
    }

    const body = await req.json().catch(() => null)
    const parsed = createProjectSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(
        {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'بيانات غير صالحة.',
          retryable: false,
        },
        400,
        requestId,
      )
    }
    const data = parsed.data

    // مسار مبدئي استنتاجي — يُعرض للمستخدم ويصححه التحليل لاحقًا
    const heur = heuristicRoute(data)

    const project = await db.project.create({
      data: {
        title: data.title?.trim() || 'مشروع بدون عنوان',
        idea: data.idea,
        projectType: data.projectType,
        platform: data.platform,
        durationSeconds: data.durationSeconds,
        aspectRatio: data.aspectRatio,
        language: data.language,
        tone: data.tone,
        targetAudience: data.targetAudience,
        preferredModel: data.preferredModel,
        visualStyle: data.visualStyle,
        notes: data.notes,
        status: 'draft',
        route: heur.route,
        routeReason: heur.reason,
      },
    })

    return NextResponse.json(toProjectSummary(project), { status: 201 })
  } catch (err) {
    console.error('[POST /api/projects]', err)
    return apiError(
      { code: 'INTERNAL_ERROR', message: 'حدث خطأ داخلي أثناء إنشاء المشروع.', retryable: true },
      500,
      requestId,
    )
  }
}

export async function GET() {
  const requestId = makeRequestId()
  try {
    const projects = await db.project.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ projects: projects.map(toProjectSummary) })
  } catch (err) {
    console.error('[GET /api/projects]', err)
    return apiError(
      { code: 'INTERNAL_ERROR', message: 'تعذر جلب المشاريع.', retryable: true },
      500,
      requestId,
    )
  }
}
