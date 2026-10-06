import { PrismaClient } from '@prisma/client'
import { blobSyncEnabled, restoreSyncState, scheduleSync } from './db-sync'

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createExtendedClient>
  schemaInit?: Promise<void>
}

// SQL المطابق لمخرج prisma db push (SQLite) — للتشغيل الذاتي في بيئة serverless
const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "idea" TEXT NOT NULL,
    "projectType" TEXT NOT NULL DEFAULT 'auto',
    "platform" TEXT,
    "durationSeconds" INTEGER,
    "aspectRatio" TEXT,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "tone" TEXT,
    "targetAudience" TEXT,
    "preferredModel" TEXT,
    "visualStyle" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "route" TEXT,
    "routeReason" TEXT,
    "analysis" JSONB,
    "currentStage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "ProjectStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "version" INTEGER NOT NULL DEFAULT 0,
    "output" JSONB,
    "inputSnapshot" JSONB,
    "error" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectStage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "StageVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectStageId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "output" JSONB NOT NULL,
    "note" TEXT,
    "provider" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StageVersion_projectStageId_fkey" FOREIGN KEY ("projectStageId") REFERENCES "ProjectStage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ProjectStage_projectId_stageId_key" ON "ProjectStage"("projectId", "stageId")`,
]

// عمليات الكتابة التي تستدعي المزامنة
const WRITE_OPS = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
])

const rawClient = new PrismaClient()

async function ensureSchemaOnce(): Promise<void> {
  if (!globalForPrisma.schemaInit) {
    globalForPrisma.schemaInit = (async () => {
      const isServerlessSqlite =
        process.env.DATABASE_URL?.startsWith('file:') && process.env.VERCEL === '1'
      if (isServerlessSqlite) {
        // 1) إنشاء الجداول عند البداية الباردة
        for (const sql of SCHEMA_SQL) {
          await rawClient.$executeRawUnsafe(sql)
        }
        // 2) استعادة الحالة المشتركة من Vercel Blob إن كانت القاعدة المحلية فارغة
        if (blobSyncEnabled()) {
          await restoreSyncState(rawClient as never)
        }
      }
    })().catch((err) => {
      globalForPrisma.schemaInit = undefined // السماح بإعادة المحاولة عند الفشل
      throw err
    })
  }
  return globalForPrisma.schemaInit
}

function createExtendedClient() {
  // كل استعلام يضمن الجداول والاستعادة مرة واحدة لكل نسخة،
  // وكل كتابة تجدول مزامنة الحالة إلى Blob (fire-and-forget)
  return rawClient.$extends({
    query: {
      $allOperations: async ({ operation, query, args }) => {
        await ensureSchemaOnce()
        const result = await query(args)
        if (WRITE_OPS.has(operation) && blobSyncEnabled()) {
          scheduleSync(rawClient as never)
        }
        return result
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createExtendedClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
