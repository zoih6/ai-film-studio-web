'use client'

// Generation Progress — PRD §9 (الشاشة 4): Timeline للمراحل، حالة كل مرحلة،
// شرح مختصر، بلا نصوص تقنية أو أسماء وكلاء.

import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Wordmark } from '@/components/brand/brand'
import { STAGE_DEFINITIONS, getStageDefinition, stagesForRoute, ROUTE_LABELS } from '@/lib/domain/stages'
import { AlertTriangle, CheckCircle2, Loader2, Clock, RefreshCcw, ArrowLeft } from 'lucide-react'
import type { StageResult } from '@/types'

export function ProgressView() {
  const project = useAppStore((s) => s.project)
  const generation = useAppStore((s) => s.generation)
  const retryStage = useAppStore((s) => s.retryStage)
  const setView = useAppStore((s) => s.setView)

  if (!project) return null
  const route = project.route || 'full-production'
  const order = stagesForRoute(route)

  const statusOf = (sid: string): StageResult['status'] => {
    const rec = project!.stages.find((s) => s.stageId === sid)
    if (generation.activeStage === sid && generation.loopRunning) return 'running'
    return rec?.status || 'pending'
  }

  const pct = generation.totalCount ? Math.round((generation.completedCount / generation.totalCount) * 100) : 0

  return (
    <div className="min-h-screen bg-background grid-noise">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Wordmark />
          <Badge variant="secondary" className="bg-brand-soft text-brand border-brand/20">
            {ROUTE_LABELS[route]}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 pb-24" dir="rtl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">جارٍ بناء حزمة الإنتاج…</h1>
          <p className="text-sm text-muted-foreground mb-5">
            {generation.error
              ? 'توقف التوليد — يمكنك إعادة المحاولة للمرحلة المتأثرة فقط دون فقدان ما اكتمل.'
              : 'كل مرحلة تُبنى على مخرجات المراحل المعتمدة قبلها. لا تغلق الصفحة إلا عند الانتهاء.'}
          </p>
          <div className="flex items-center gap-4">
            <Progress value={pct} className="h-2 flex-1 [&>div]:bg-gradient-to-l [&>div]:from-brand [&>div]:to-cyan-brand" />
            <span className="text-sm font-semibold text-brand whitespace-nowrap">
              {generation.completedCount}/{generation.totalCount}
            </span>
          </div>
        </div>

        {/* خطأ المرحلة */}
        {generation.error && (
          <Card className="border-danger/30 bg-danger/5 mb-6">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-danger mb-1">تعذر توليد هذه المرحلة الآن</div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{generation.error.message}</p>
                  <div className="flex gap-2">
                    {generation.error.retryable && (
                      <Button onClick={() => void retryStage()} className="gap-2" size="sm">
                        <RefreshCcw className="h-3.5 w-3.5" />
                        أعد محاولة هذه المرحلة
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setView('workspace')}
                      className="gap-2"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      افتح مساحة العمل
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline المراحل */}
        <ol className="relative space-y-1">
          {order.map((sid, i) => {
            const status = statusOf(sid)
            const def = getStageDefinition(sid) || STAGE_DEFINITIONS[0]
            const prevDone = i === 0 || statusOf(order[i - 1]) === 'completed' || statusOf(order[i - 1]) === 'approved'
            return (
              <li key={sid} className="relative pr-10 pb-4">
                {/* خط الترابط */}
                {i < order.length - 1 && (
                  <span
                    className={`absolute right-[15px] top-9 bottom-0 w-0.5 ${
                      status === 'completed' || status === 'approved' ? 'stage-line' : 'bg-border/60'
                    }`}
                    aria-hidden="true"
                  />
                )}
                {/* عقدة المرحلة */}
                <span className="absolute right-0 top-1.5 grid h-8 w-8 place-items-center rounded-full border-2 z-10 bg-background">
                  {status === 'completed' || status === 'approved' ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : status === 'running' ? (
                    <Loader2 className="h-5 w-5 text-brand animate-spin" />
                  ) : status === 'failed' ? (
                    <AlertTriangle className="h-5 w-5 text-danger" />
                  ) : (
                    <Clock className={`h-4.5 w-4.5 ${prevDone ? 'text-muted-foreground' : 'text-muted-foreground/40'}`} />
                  )}
                </span>

                <div className={`rounded-xl border p-4 transition-all ${status === 'running' ? 'border-brand/40 bg-brand-soft/20' : status === 'failed' ? 'border-danger/30 bg-danger/5' : status === 'completed' || status === 'approved' ? 'border-border bg-surface/50' : 'border-border/50 bg-transparent opacity-60'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm">{def.labelAr}</h3>
                    <span className="text-[11px] text-muted-foreground font-mono" dir="ltr">{def.labelEn}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{def.descriptionAr}</p>
                </div>
              </li>
            )
          })}
        </ol>

        {/* الانتقال للمساحة أثناء التوليد */}
        {!generation.error && generation.loopRunning && (
          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => setView('workspace')} className="text-muted-foreground gap-1.5">
              استعرض ما اكتمل حتى الآن في مساحة العمل
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
