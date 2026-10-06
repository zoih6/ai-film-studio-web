// GET /api/projects/:id/export?format=markdown|json — التصدير
// PRD §8 (FR-09): اسم الملف يتضمن slug المشروع وإصدار الحزمة

import { NextRequest, NextResponse } from 'next/server'
import { db, refreshStateFromBlob } from '@/lib/db'
import { apiError, makeRequestId, toProjectDetail } from '@/lib/api/respond'
import { buildJsonExport, buildMarkdownExport, projectSlug } from '@/lib/export/exporters'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ projectId: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const requestId = makeRequestId()
  try {
    const { projectId } = await ctx.params
    await refreshStateFromBlob()
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { stages: true },
    })
    if (!project) {
      return apiError({ code: 'NOT_FOUND', message: 'المشروع غير موجود.' }, 404, requestId)
    }

    const detail = toProjectDetail(project, project.stages)
    const format = (req.nextUrl.searchParams.get('format') || 'markdown').toLowerCase()
    const slug = projectSlug(project.title)
    const version = project.stages.reduce((max, s) => Math.max(max, s.version), 0) || 1

    // ترويسة اسم ملف تدعم العربية عبر RFC 5987 مع بديل ASCII آمن
    const contentDisposition = (ext: string) => {
      const ascii = `ai-film-studio-v${version}.${ext}`
      const utf8 = encodeURIComponent(`${slug}-v${version}.${ext}`)
      return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`
    }

    if (format === 'json') {
      return new NextResponse(buildJsonExport(detail), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': contentDisposition('json'),
        },
      })
    }

    if (format === 'markdown') {
      return new NextResponse(buildMarkdownExport(detail), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': contentDisposition('md'),
        },
      })
    }

    return apiError(
      { code: 'VALIDATION_ERROR', message: 'صيغة تصدير غير مدعومة. استخدم markdown أو json.', retryable: false },
      400,
      requestId,
    )
  } catch (err) {
    console.error('[GET export]', err)
    return apiError({ code: 'INTERNAL_ERROR', message: 'تعذر التصدير.', retryable: true }, 500, requestId)
  }
}
