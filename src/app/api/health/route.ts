// GET /api/health — فحص صحة الخدمة والمزود
// مفيد للتشخيص والمراقبة دون كشف أي أسرار.

import { NextResponse } from 'next/server'
import { getProviderAsync } from '@/lib/ai/provider-factory'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET() {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
  const providerMode = process.env.AI_PROVIDER || (hasGeminiKey ? 'gemini' : 'none')

  let providerHealth: { ok: boolean; provider: string; model: string; message?: string; rawDetail?: string } | null = null
  try {
    const provider = await getProviderAsync()
    providerHealth = await provider.healthCheck()
  } catch (err) {
    providerHealth = {
      ok: false,
      provider: 'unavailable',
      model,
      message: err instanceof Error ? err.message : 'unknown error',
      rawDetail: (err as { rawDetail?: string }).rawDetail,
    }
  }

  return NextResponse.json(
    {
      ok: providerHealth?.ok ?? false,
      env: {
        GEMINI_API_KEY: hasGeminiKey ? 'set' : 'missing',
        GEMINI_MODEL: model,
        AI_PROVIDER: providerMode,
        DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
        BLOB_STORE_ID: process.env.BLOB_STORE_ID ? 'set' : 'missing',
        VERCEL: process.env.VERCEL || null,
      },
      provider: providerHealth,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
