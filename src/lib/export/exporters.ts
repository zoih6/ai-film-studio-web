// طبقة التصدير — Markdown و JSON
// المصدر: PRD §8 (FR-09 النسخ والتصدير)

import type { ProjectDetail } from '@/types'
import { getStageDefinition, ROUTE_LABELS, stagesForRoute } from '@/lib/domain/stages'

export function projectSlug(title: string): string {
  const cleaned = title
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return cleaned || 'ai-film-project'
}

export function buildJsonExport(project: ProjectDetail): string {
  const route = project.route || 'full-production'
  const order = stagesForRoute(route)
  const payload = {
    meta: {
      projectId: project.id,
      title: project.title,
      exportedAt: new Date().toISOString(),
      packageVersion: 1,
      route,
      routeLabel: ROUTE_LABELS[route] || route,
      status: project.status,
    },
    intake: {
      idea: project.idea,
      projectType: project.projectType,
      platform: project.platform,
      durationSeconds: project.durationSeconds,
      aspectRatio: project.aspectRatio,
      language: project.language,
      tone: project.tone,
      targetAudience: project.targetAudience,
      preferredModel: project.preferredModel,
      visualStyle: project.visualStyle,
      notes: project.notes,
    },
    analysis: project.analysis,
    stages: order.map((sid) => {
      const rec = project.stages.find((s) => s.stageId === sid)
      const def = getStageDefinition(sid)
      return {
        stageId: sid,
        label: def?.labelEn || sid,
        status: rec?.status || 'pending',
        version: rec?.version || 0,
        output: rec?.output ?? null,
        dependencies: order.slice(0, order.indexOf(sid)),
      }
    }),
  }
  return JSON.stringify(payload, null, 2)
}

function outputToMarkdown(stageId: string, output: unknown): string {
  if (!output) return '_لم تُولّد هذه المرحلة بعد._'
  const def = getStageDefinition(stageId)
  const lines: string[] = [`### ${def?.labelAr || stageId} \`${stageId}\``, '']

  const pushValue = (label: string, value: unknown) => {
    if (typeof value === 'string' && value) lines.push(`- **${label}:** ${value}`)
  }

  if (stageId === 'image-prompts' || stageId === 'motion-prompts' || stageId === 'final-prompt') {
    const prompts = (output as { prompts?: unknown[]; prompt?: string; title?: string; frameId?: string; shotId?: string; durationSeconds?: number }).prompts
    if (Array.isArray(prompts)) {
      prompts.forEach((p) => {
        const item = p as { frameId?: string; shotId?: string; title?: string; prompt: string; durationSeconds?: number; firstFrameRole?: string; lastFrameRole?: string }
        const head = item.frameId || item.shotId || ''
        lines.push(`#### ${head ? `${head} — ` : ''}${item.title || ''}${item.durationSeconds ? ` (${item.durationSeconds}s)` : ''}`, '')
        lines.push('```text', item.prompt, '```', '')
        if (item.firstFrameRole || item.lastFrameRole) {
          lines.push(`- أول فريم: ${item.firstFrameRole || '-'} | آخر فريم: ${item.lastFrameRole || '-'}`, '')
        }
      })
    } else if (typeof (output as { prompt?: string }).prompt === 'string') {
      const o = output as { prompt: string; negativePrompt?: string; notes?: string; targetUse?: string }
      lines.push('```text', o.prompt, '```', '')
      if (o.negativePrompt) lines.push(`- **Negative:** ${o.negativePrompt}`)
      if (o.notes) lines.push(`- **ملاحظات:** ${o.notes}`)
      lines.push('')
    }
    return lines.join('\n')
  }

  // بقية المراحل: JSON في كتلة JSON مقروءة
  lines.push('```json', JSON.stringify(output, null, 2), '```', '')
  return lines.join('\n')
}

export function buildMarkdownExport(project: ProjectDetail): string {
  const route = project.route || 'full-production'
  const order = stagesForRoute(route)
  const total = project.durationSeconds
  const parts: string[] = []

  parts.push(`# ${project.title}`, '')
  parts.push(`> ${project.analysis?.summary || project.idea}`, '')
  parts.push('## معلومات الحزمة', '')
  parts.push(`- **المسار:** ${ROUTE_LABELS[route] || route}`)
  if (project.routeReason) parts.push(`- **سبب اختيار المسار:** ${project.routeReason}`)
  parts.push(`- **المنصة:** ${project.platform || 'غير محددة'}`)
  parts.push(`- **المدة:** ${total ? `${total} ثانية` : 'غير محددة'}`)
  parts.push(`- **النسبة:** ${project.aspectRatio || 'غير محددة'}`)
  parts.push(`- **اللغة:** ${project.language}`)
  if (project.tone) parts.push(`- **النبرة:** ${project.tone}`)
  parts.push(`- **حالة المشروع:** ${project.status}`)
  parts.push('')

  parts.push('## الفكرة الأصلية', '')
  parts.push(project.idea, '')
  parts.push('---', '')

  for (const sid of order) {
    const rec = project.stages.find((s) => s.stageId === sid)
    parts.push(outputToMarkdown(sid, rec?.output))
    parts.push('---', '')
  }

  return parts.join('\n')
}
