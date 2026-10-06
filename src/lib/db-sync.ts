// مزامنة حالة SQLite عبر Vercel Blob — تجاوز طبيعة /tmp المؤقتة في serverless.
// المبدأ: كتابة كل عملية → مزامنة متزامنة (awaited)؛ قراءة/توليد → تحديث من أحدث حالة.
// ملاحظة معمارية: هذا حل MVP يعمل بدقة لتدففق العمل التسلسلي؛ للإنتاج متعدد المستخدمين المتزامنين اربط Postgres.

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
  project: {
    findMany(): Promise<SyncableProject[]>
    count(): Promise<number>
    createMany(args: { data: unknown[] }): Promise<{ count: number }>
    findUnique(args: { where: { id: string } }): Promise<SyncableProject | null>
    upsert(args: { where: { id: string }; create: unknown; update: unknown }): Promise<unknown>
  }
  projectStage: {
    findMany(): Promise<SyncableStage[]>
    createMany(args: { data: unknown[] }): Promise<{ count: number }>
    findUnique(args: { where: { projectId_stageId: { projectId: string; stageId: string } } }): Promise<SyncableStage | null>
    upsert(args: { where: { id: string }; create: unknown; update: unknown }): Promise<unknown>
  }
  stageVersion: {
    findMany(): Promise<SyncableVersion[]>
    createMany(args: { data: unknown[] }): Promise<{ count: number }>
    findUnique(args: { where: { id: string } }): Promise<SyncableVersion | null>
    create(args: { data: unknown }): Promise<unknown>
  }
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

async function pushSyncState(raw: RawClient): Promise<void> {
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

// مزامنة فورية — تُنتظر قبل إرسال الاستجابة حتى يجد الطلب التالي أحدث حالة
let syncChain: Promise<void> = Promise.resolve()

export function syncStateNow(raw: RawClient): Promise<void> {
  const run = syncChain.then(() => pushSyncState(raw)).catch((err) => {
    console.error('[blob-sync] push failed:', err instanceof Error ? err.message : err)
  })
  syncChain = run
  return run
}

// استعادة كاملة عند البداية الباردة (القاعدة المحلية فارغة)
export async function restoreSyncState(raw: RawClient): Promise<boolean> {
  const state = await fetchSyncState()
  if (!state || state.projects.length === 0) return false
  const existing = await raw.project.count()
  if (existing > 0) return false

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

const toMs = (d: Date | string) => new Date(d).getTime()

// تحديث تدريجي: دمج السجلات الأحدث من Blob إلى القاعدة المحلية
// يُستدعى قبل عمليات القراءة/التوليد حتى تعمل كل نسخة على أحدث حالة
export async function refreshFromBlob(raw: RawClient): Promise<void> {
  const state = await fetchSyncState()
  if (!state) return

  // المشاريع: upsert لكل سجل أحدث من المحلي
  for (const p of state.projects) {
    const local = await raw.project.findUnique({ where: { id: p.id } })
    if (!local || toMs(p.updatedAt) > toMs(local.updatedAt)) {
      await raw.project.upsert({
        where: { id: p.id },
        create: p as unknown,
        update: p as unknown,
      })
    }
  }

  // المراحل
  for (const s of state.stages) {
    const local = await raw.projectStage.findUnique({
      where: { projectId_stageId: { projectId: s.projectId, stageId: s.stageId } },
    })
    if (!local || toMs(s.updatedAt) > toMs(local.updatedAt)) {
      await raw.projectStage.upsert({
        where: { id: s.id },
        create: s as unknown,
        update: s as unknown,
      })
    }
  }

  // الإصدارات (سجلات تراكمية — الإضافة فقط عند الغياب)
  for (const v of state.versions) {
    const local = await raw.stageVersion.findUnique({ where: { id: v.id } })
    if (!local) {
      await raw.stageVersion.create({ data: v as unknown })
    }
  }
}
