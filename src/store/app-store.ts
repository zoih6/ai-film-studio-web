'use client'

// متجر حالة التطبيق — تدفق: landing → intake → review → progress → workspace
// يحرّك حلقة توليد المراحل (client-driven loop متوافق مع serverless)

import { create } from 'zustand'
import type { ProjectDetail, ProjectSummary, ApiError } from '@/types'
import { stagesForRoute } from '@/lib/domain/stages'

export type AppView = 'landing' | 'intake' | 'review' | 'progress' | 'workspace'

interface GenerationState {
  activeStage: string | null
  completedCount: number
  totalCount: number
  error: { code: string; message: string; retryable: boolean } | null
  loopRunning: boolean
}

interface AppState {
  view: AppView
  project: ProjectDetail | null
  projects: ProjectSummary[]
  generation: GenerationState
  loadingProject: boolean
  booting: boolean

  // تصفح
  setView: (v: AppView) => void
  goHome: () => void
  openIntake: (idea?: string) => void

  // مشاريع
  fetchProjects: () => Promise<void>
  createProject: (data: Record<string, unknown>) => Promise<ProjectSummary | null>
  loadProject: (id: string) => Promise<void>
  patchProject: (id: string, data: Record<string, unknown>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  // التحليل والتوليد
  analyze: () => Promise<void>
  startGeneration: () => Promise<void>
  retryStage: () => Promise<void>
  regenerateStage: (stageId: string, note: string) => Promise<boolean>
  approveStage: (stageId: string) => Promise<void>
  stopLoop: () => void

  // التصدير
  exportUrl: (format: 'markdown' | 'json') => string
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: body as ApiError }
    }
    return { ok: true, data: body as T }
  } catch {
    return {
      ok: false,
      error: { error: { code: 'NETWORK', message: 'تعذر الاتصال بالخادم. تحقق من اتصالك وأعد المحاولة.', retryable: true, requestId: '-' } },
    }
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'landing',
  project: null,
  projects: [],
  generation: { activeStage: null, completedCount: 0, totalCount: 0, error: null, loopRunning: false },
  loadingProject: false,
  booting: true,

  setView: (v) => set({ view: v }),
  goHome: () => {
    get().stopLoop()
    set({ view: 'landing', project: null, generation: { activeStage: null, completedCount: 0, totalCount: 0, error: null, loopRunning: false } })
    void get().fetchProjects()
  },
  openIntake: (idea) => set({ view: 'intake', ...(idea !== undefined ? {} : {}) }),

  fetchProjects: async () => {
    const res = await api<{ projects: ProjectSummary[] }>('/api/projects')
    if (res.ok) set({ projects: res.data.projects })
  },

  createProject: async (data) => {
    const res = await api<ProjectSummary>('/api/projects', { method: 'POST', body: JSON.stringify(data) })
    if (!res.ok) {
      return null
    }
    const summary = res.data
    set({ project: { ...summary, stages: [] } })
    return summary
  },

  loadProject: async (id) => {
    set({ loadingProject: true })
    const res = await api<ProjectDetail>(`/api/projects/${id}`)
    if (res.ok) {
      const p = res.data
      const route = p.route || 'full-production'
      set({
        project: p,
        view: p.status === 'completed' ? 'workspace' : p.status === 'review' ? 'review' : p.status === 'generating' ? 'workspace' : p.status === 'draft' ? 'review' : 'workspace',
        generation: { activeStage: p.currentStage ?? null, completedCount: p.stages.filter((s) => s.status === 'completed' || s.status === 'approved').length, totalCount: stagesForRoute(route).length, error: null, loopRunning: false },
      })
    }
    set({ loadingProject: false })
  },

  patchProject: async (id, data) => {
    const res = await api<ProjectDetail>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    if (res.ok) set({ project: res.data })
  },

  deleteProject: async (id) => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' }).catch(() => null)
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id), project: s.project?.id === id ? null : s.project }))
  },

  analyze: async () => {
    const { project } = get()
    if (!project) return
    const res = await api<{ project: ProjectDetail }>(`/api/projects/${project.id}/analyze`, { method: 'POST', body: JSON.stringify({}) })
    if (res.ok) {
      const p = res.data.project
      set({ project: p, view: 'review' })
    }
  },

  startGeneration: async () => {
    const { project, generation } = get()
    if (!project || generation.loopRunning) return
    const route = project.route || 'full-production'
    const order = stagesForRoute(route)

    set({
      view: 'progress',
      generation: {
        activeStage: project.currentStage || order[0],
        completedCount: project.stages.filter((s) => s.status === 'completed' || s.status === 'approved').length,
        totalCount: order.length,
        error: null,
        loopRunning: true,
      },
    })

    // حلقة توليد المراحل — كل دورة طلب واحد قصير
    let current = get().project
    while (current) {
      const gen = get().generation
      if (!gen.loopRunning) break

      const pending = order.find((sid) => {
        const rec = current!.stages.find((s) => s.stageId === sid)
        return !rec || (rec.status !== 'completed' && rec.status !== 'approved')
      })
      if (!pending) break

      set({ generation: { ...get().generation, activeStage: pending, error: null } })

      const res = await api<{ project: ProjectDetail; stage: string; status: string; error: unknown }>(
        `/api/projects/${current.id}/generate`,
        { method: 'POST', body: JSON.stringify({ stageId: pending }) },
      )

      if (!res.ok) {
        set({
          generation: {
            ...get().generation,
            loopRunning: false,
            error: res.error.error,
          },
        })
        return
      }

      const outcome = res.data
      current = outcome.project
      set({ project: outcome.project })

      if (outcome.status === 'failed') {
        const err = outcome.error as { code?: string; message?: string; retryable?: boolean } | null
        set({
          generation: {
            ...get().generation,
            loopRunning: false,
            error: err
              ? { code: err.code || 'AI_PROVIDER_ERROR', message: err.message || 'فشل توليد المرحلة.', retryable: err.retryable ?? true }
              : { code: 'AI_PROVIDER_ERROR', message: 'فشل توليد المرحلة.', retryable: true },
          },
        })
        return
      }

      set({
        generation: {
          ...get().generation,
          completedCount: outcome.project.stages.filter((s) => s.status === 'completed' || s.status === 'approved').length,
          activeStage: outcome.project.currentStage ?? null,
        },
      })
    }

    // اكتملت الحلقة
    const done = get().project
    if (done && done.status === 'completed') {
      set({ view: 'workspace', generation: { ...get().generation, loopRunning: false, activeStage: null } })
    } else {
      set({ generation: { ...get().generation, loopRunning: false } })
    }
  },

  retryStage: async () => {
    const { project } = get()
    if (!project) return
    const route = project.route || 'full-production'
    const order = stagesForRoute(route)
    const failed = project.stages.find((s) => s.status === 'failed')
    const pending = order.find((sid) => {
      const rec = project.stages.find((s) => s.stageId === sid)
      return !rec || (rec.status !== 'completed' && rec.status !== 'approved')
    })
    const target = failed?.stageId || pending
    if (target) {
      set({ generation: { ...get().generation, error: null } })
      await get().regenerateStage(target, 'إعادة محاولة بعد فشل المرحلة.')
    }
  },

  regenerateStage: async (stageId, note) => {
    const { project } = get()
    if (!project) return false
    const res = await api<{ project: ProjectDetail; status: string; error: unknown }>(
      `/api/projects/${project.id}/stages/${stageId}/regenerate`,
      { method: 'POST', body: JSON.stringify({ note }) },
    )
    if (res.ok) {
      set({ project: res.data.project })
      return res.data.status !== 'failed'
    }
    return false
  },

  approveStage: async (stageId) => {
    const { project } = get()
    if (!project) return
    const res = await api<ProjectDetail>(`/api/projects/${project.id}/stages/${stageId}/approve`, { method: 'POST' })
    if (res.ok) set({ project: res.data })
  },

  stopLoop: () => {
    set((s) => (s.generation.loopRunning ? { generation: { ...s.generation, loopRunning: false } } : {}))
  },

  exportUrl: (format) => `/api/projects/${get().project?.id || ''}/export?format=${format}`,
}))
