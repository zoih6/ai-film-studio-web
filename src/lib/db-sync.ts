// مزامنة حالة SQLite عبر Vercel Blob — تجاوز طبيعة /tmp المؤقتة في serverless.
// المبدأ: كل نسخة lambda تستعيد الحالة عند البداية الباردة، وتزامنها بعد كل تعديل.
// ملاحظة معمارية: هذا حل MVP أحادي المستخدم؛ للإنتاج متعدد المستخدمين اربط Postgres.

import { put, get } from '@vercel/blob'

const STATE_KEY = 'ai-film-studio-state-v1.json'

interface SyncableProject {
  id: string
  title: string
  idea: string
  projectType: string
  platform?: string | null
  durationSeconds?: number | null
  aspectRatio?: string | null
  language: string
  tone?: string | null
  targetAudience?: string | null
  preferredModel?: string | null
  visualStyle?: string | null
  notes?: string | null
  status: string
  route?: string | null
  routeReason?: string | null
  analysis?: unknown
  currentStage?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

interface SyncableStage {
  id: string
  projectId: string
  stageId: string
  status: string
  version: number
  output?: unknown
  inputSnapshot?: unknown
  error?: unknown
  createdAt: Date | string
  updatedAt: Date | string
}

interface SyncableVersion {
  id: string
  projectStageId: string
  version: number
  output: unknown
  note?: string | null
  provider?: string | null
  createdAt: Date | string
}

export interface SyncState {
  projects: SyncableProject[]
  stages: SyncableStage[]
  versions: SyncableVersion[]
  syncedAt: string
}

type RawClient = {
  project: { findMany(): Promise<SyncableProject[]>; count(): Promise<number>; createMany(args: { data: unknown[] }): Promise<{ count: number }> }
  projectStage: { findMany(): Promise<SyncableStage[]>; createMany(args: { data: unknown[] }): Promise<{ count: number }> }
  stageVersion: { findMany(): Promise<SyncableVersion[]>; createMany(args: { data: unknown[] }): Promise<{ count: number }> }
}

export function blobSyncEnabled(): boolean {
  return (
    process.env.VERCEL === '1' &&
    !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_OIDC_TOKEN)
  )
}

export async function fetchSyncState(): Promise<SyncState | null> {
  try {
    const res = await get(STATE_KEY, {
      access: 'private',
      storeId: process.env.BLOB_STORE_ID,
      useCache: false,
    })
    if (!res || res.statusCode !== 200 || !res.stream) return null
    const text = await new Response(res.stream).text()
    if (!text) return null
    const state = JSON.parse(text) as SyncState
    if (!state || !Array.isArray(state.projects)) return null
    return state
  } catch (err) {
    console.error('[blob-sync] fetch failed:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function pushSyncState(raw: RawClient): Promise<void> {
  const [projects, stages, versions] = await Promise.all([
    raw.project.findMany(),
    raw.projectStage.findMany(),
    raw.stageVersion.findMany(),
  ])
  const state: SyncState = {
    projects,
    stages,
    versions,
    syncedAt: new Date().toISOString(),
  }
  await put(STATE_KEY, JSON.stringify(state), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
    storeId: process.env.BLOB_STORE_ID,
  })
}

export async function restoreSyncState(raw: RawClient): Promise<boolean> {
  const state = await fetchSyncState()
  if (!state || state.projects.length === 0) return false
  const existing = await raw.project.count()
  if (existing > 0) return false // القاعدة المحلية ليست فارغة — لا استعادة

  if (state.projects.length) {
    await raw.project.createMany({ data: state.projects as unknown[] })
  }
  if (state.stages.length) {
    await raw.projectStage.createMany({ data: state.stages as unknown[] })
  }
  if (state.versions.length) {
    await raw.stageVersion.createMany({ data: state.versions as unknown[] })
  }
  console.log(`[blob-sync] restored ${state.projects.length} projects, ${state.stages.length} stages, ${state.versions.length} versions`)
  return true
}

// مجدول مزامنة بعد الكتابات — fire-and-forget مع دمج الطلبات المتزامنة
let syncing = false
let pending = false
let lastSyncAt = 0
const MIN_SYNC_INTERVAL_MS = 800

export function scheduleSync(raw: RawClient): void {
  const now = Date.now()
  if (now - lastSyncAt < MIN_SYNC_INTERVAL_MS) {
    // قريبة من المزامنة السابقة — أجّلها قليلًا
    setTimeout(() => scheduleSync(raw), MIN_SYNC_INTERVAL_MS)
    return
  }
  if (syncing) {
    pending = true
    return
  }
  syncing = true
  pushSyncState(raw)
    .then(() => {
      lastSyncAt = Date.now()
    })
    .catch((err) => {
      console.error('[blob-sync] push failed:', err instanceof Error ? err.message : err)
    })
    .finally(() => {
      syncing = false
      if (pending) {
        pending = false
        scheduleSync(raw)
      }
    })
}
