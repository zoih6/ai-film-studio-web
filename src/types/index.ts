// AI Film Studio Web — أنواع المشروع والمراحل
// المصدر: docs/product/PRD.md §11 (نموذج البيانات الأساسي)

export type ProjectType =
  | 'auto'
  | 'commercial'
  | 'documentary'
  | 'film'
  | 'motion'
  | 'series'
  | 'prompt'

export type ProjectStatus =
  | 'draft'
  | 'analyzing'
  | 'review'
  | 'generating'
  | 'completed'
  | 'failed'

export type StageStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'approved'

export type RouteId =
  | 'shortcut-prompt'
  | 'commercial-engine'
  | 'documentary-engine'
  | 'full-production'
  | 'motion-engine'
  | 'series-engine'

export interface IntentAnalysis {
  intent: string
  scope: 'single_shot' | 'scene' | 'full_project' | 'prompt_only'
  suggestedType: ProjectType
  suggestedRoute: RouteId
  routeReason: string
  summary: string
  missingInfo: string[]
  inferred: {
    platform?: string
    durationSeconds?: number
    aspectRatio?: string
    tone?: string
    language?: string
    targetAudience?: string
  }
}

export interface ProjectSummary {
  id: string
  title: string
  idea: string
  projectType: ProjectType
  platform?: string | null
  durationSeconds?: number | null
  aspectRatio?: string | null
  language: string
  tone?: string | null
  targetAudience?: string | null
  preferredModel?: string | null
  visualStyle?: string | null
  notes?: string | null
  status: ProjectStatus
  route?: string | null
  routeReason?: string | null
  analysis?: IntentAnalysis | null
  currentStage?: string | null
  createdAt: string
  updatedAt: string
}

export interface StageResult {
  stageId: string
  status: StageStatus
  version: number
  output?: unknown
  error?: {
    code: string
    message: string
    retryable: boolean
  } | null
  updatedAt: string
}

export interface ProjectDetail extends ProjectSummary {
  stages: StageResult[]
}

// غلاف الأخطاء الموحد — PRD §12
export interface ApiError {
  error: {
    code: string
    message: string
    retryable: boolean
    requestId: string
  }
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  AI_PARSE_ERROR: 'AI_PARSE_ERROR',
  PIPELINE_ERROR: 'PIPELINE_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const
