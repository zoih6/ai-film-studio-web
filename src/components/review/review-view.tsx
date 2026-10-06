'use client'

// Intent Review — PRD §9 (الشاشة 3): بطاقة تلخيص، المسار المقترح،
// الأسئلة الناقصة إن وجدت، وزر اعتماد الاتجاه.

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wordmark } from '@/components/brand/brand'
import { ROUTE_LABELS } from '@/lib/domain/stages'
import { useToast } from '@/hooks/use-toast'
import { ArrowRight, CheckCircle2, Loader2, Route, HelpCircle, Play, PenLine } from 'lucide-react'

export function ReviewView() {
  const project = useAppStore((s) => s.project)
  const startGeneration = useAppStore((s) => s.startGeneration)
  const analyze = useAppStore((s) => s.analyze)
  const patchProject = useAppStore((s) => s.patchProject)
  const setView = useAppStore((s) => s.setView)
  const { toast } = useToast()
  const [busy, setBusy] = useState<'start' | 'reanalyze' | null>(null)

  if (!project) return null
  const analysis = project.analysis

  const totalSeconds = project.durationSeconds
  const platformLabel = project.platform || 'غير محددة'

  const begin = async () => {
    setBusy('start')
    await startGeneration()
    setBusy(null)
  }

  const reanalyze = async () => {
    setBusy('reanalyze')
    await analyze()
    setBusy(null)
  }

  return (
    <div className="min-h-screen bg-background grid-noise">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => setView('landing')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>
          <Wordmark />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 pb-24" dir="rtl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3.5 py-1.5 text-xs text-success mb-4">
            <CheckCircle2 className="h-3.5 w-3.5" />
            تم فهم فكرتك — راجع الاتجاه قبل الانطلاق
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{project.title}</h1>
          {analysis && <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>}
        </div>

        {/* بطاقة المسار */}
        <Card className="border-brand/25 bg-surface/70 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-brand-soft grid place-items-center">
                <Route className="h-6 w-6 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h2 className="text-lg font-bold">
                    {ROUTE_LABELS[project.route || ''] || 'مسار مخصص'}
                  </h2>
                  <Badge className="bg-brand text-white border-0">{analysis?.scope === 'prompt_only' ? 'نطاق: برومبت واحد' : analysis?.scope === 'single_shot' ? 'نطاق: لقطة واحدة' : 'نطاق: مشروع كامل'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{project.routeReason}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary" className="bg-elevated">{platformLabel}</Badge>
                  {totalSeconds ? <Badge variant="secondary" className="bg-elevated">{totalSeconds} ثانية</Badge> : null}
                  {project.aspectRatio ? <Badge variant="secondary" className="bg-elevated">{project.aspectRatio}</Badge> : null}
                  {project.tone ? <Badge variant="secondary" className="bg-elevated">النبرة: {project.tone}</Badge> : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* أسئلة ناقصة إن وجدت */}
        {analysis && analysis.missingInfo.length > 0 && (
          <Card className="border-warning/25 bg-warning/5 mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-warning font-semibold text-sm mb-3">
                <HelpCircle className="h-4 w-4" />
                معلومات ستُستنتج تلقائيًا (يمكنك تجاهلها)
              </div>
              <ul className="space-y-2">
                {analysis.missingInfo.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-warning">•</span>
                    {q}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* الفكرة الأصلية */}
        <Card className="bg-surface/50 mb-8">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              فكرتك الأصلية
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{project.idea}</p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" onClick={begin} disabled={busy !== null} className="gap-2 font-semibold flex-1 h-13 text-base">
            {busy === 'start' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {busy === 'start' ? 'جارٍ بدء الإنتاج…' : 'اعتمد الاتجاه وابدأ الإنتاج'}
          </Button>
          <Button variant="outline" size="lg" onClick={reanalyze} disabled={busy !== null} className="gap-2">
            {busy === 'reanalyze' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
            أعد التحليل
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={async () => {
              const nextType = project.projectType === 'commercial' ? 'documentary' : 'commercial'
              await patchProject(project.id, { projectType: nextType })
              toast({ title: 'تم تغيير النوع', description: 'أعد التحليل لتحديث المسار المقترح.' })
            }}
            className="gap-2 text-muted-foreground"
          >
            <PenLine className="h-4 w-4" />
            غيّر النوع
          </Button>
        </div>
      </main>
    </div>
  )
}
