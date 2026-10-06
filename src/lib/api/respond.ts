// أدوات مساعدة للـAPI: غلاف أخطاء موحد + تحويل المشروع للعرض
// المصدر: PRD §12 (API / Server Contracts)

import { NextResponse } from 'next/server'
import type { Project, ProjectStage } from '@prisma/client'
import type { ProjectDetail, ProjectSummary, StageResult, IntentAnalysis } from '@/types'

export function makeRequestId(): string {
  return `req_${Math.random().toString(36).slice(2, 10)}`
}

export function apiError(
  res: { code: string; message: string; retryable?: boolean },
  status: number,
  requestId = makeRequestId(),
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: res.code,
        message: res.message,
        retryable: res.retryable ?? false,
        requestId,
      },
    },
    { status },
  )
}

export function toStageResult(rec: ProjectStage): StageResult {
  return {
    stageId: rec.stageId,
    status: rec.status as StageResult['status'],
    version: rec.version,
    output: rec.output ?? undefined,
    error: (rec.error as StageResult['error']) ?? null,
    updatedAt: rec.updatedAt.toISOString(),
  }
}

export function toProjectSummary(p: Project): ProjectSummary {
  return {
    id: p.id,
    title: p.title,
    idea: p.idea,
    projectType: p.projectType as ProjectSummary['projectType'],
    platform: p.platform,
    durationSeconds: p.durationSeconds,
    aspectRatio: p.aspectRatio,
    language: p.language,
    tone: p.tone,
    targetAudience: p.targetAudience,
    preferredModel: p.preferredModel,
    visualStyle: p.visualStyle,
    notes: p.notes,
    status: p.status as ProjectSummary['status'],
    route: p.route,
    routeReason: p.routeReason,
    analysis: (p.analysis as unknown as IntentAnalysis) ?? null,
    currentStage: p.currentStage,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

export function toProjectDetail(p: Project, stages: ProjectStage[]): ProjectDetail {
  return { ...toProjectSummary(p), stages: stages.map(toStageResult) }
}
