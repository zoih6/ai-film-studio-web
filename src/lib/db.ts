import { PrismaClient } from '@prisma/client'

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

async function ensureSchemaOnce(): Promise<void> {
  if (!globalForPrisma.schemaInit) {
    globalForPrisma.schemaInit = (async () => {
      // في بيئة serverless (Vercel) مع SQLite في /tmp: تهيئة الجداول عند كل بداية باردة
      if (process.env.DATABASE_URL?.startsWith('file:') && process.env.VERCEL === '1') {
        for (const sql of SCHEMA_SQL) {
          await rawClient.$executeRawUnsafe(sql)
        }
      }
    })().catch((err) => {
      globalForPrisma.schemaInit = undefined // السماح بإعادة المحاولة عند الفشل
      throw err
    })
  }
  return globalForPrisma.schemaInit
}

const rawClient = new PrismaClient()

function createExtendedClient() {
  // كل استعلام يمر عبر ضمان التهيئة مرة واحدة لكل نسخة
  return rawClient.$extends({
    query: {
      $allOperations: async ({ query, args }) => {
        await ensureSchemaOnce()
        return query(args)
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createExtendedClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
