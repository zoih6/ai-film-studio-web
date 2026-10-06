'use client'

// Project Workspace — PRD §9 (الشاشة 5-8)
// Sidebar للمراحل + Main Canvas + Inspector + شريط علوي للاسم والحالة والتصدير

import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Logo } from '@/components/brand/brand'
import { useToast } from '@/hooks/use-toast'
import {
  getStageDefinition,
  stagesForRoute,
  ROUTE_LABELS,
} from '@/lib/domain/stages'
import type { StageResult } from '@/types'
import {
  BriefStage,
  ConceptStage,
  NarrativeStage,
  BeatsStage,
  StyleEntitiesStage,
  StoryboardStage,
  ShotCardsStage,
  ImagePromptsStage,
  MotionPromptsStage,
  AudioStage,
  DeliveryStage,
  FinalPromptStage,
  GenericStage,
} from './stage-renderers'
import {
  ClipboardList,
  Lightbulb,
  ScrollText,
  Timer,
  Palette,
  LayoutGrid,
  Camera,
  ImageIcon,
  Film,
  AudioLines,
  PackageCheck,
  Zap,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Clock,
  RefreshCcw,
  Download,
  Check,
  ChevronLeft,
  Info,
} from 'lucide-react'

const STAGE_ICONS: Record<string, typeof Zap> = {
  brief: ClipboardList,
  concept: Lightbulb,
  narrative: ScrollText,
  beats: Timer,
  'style-entities': Palette,
  storyboard: LayoutGrid,
  'shot-cards': Camera,
  'image-prompts': ImageIcon,
  'motion-prompts': Film,
  audio: AudioLines,
  delivery: PackageCheck,
  'final-prompt': Zap,
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  running: 'جارٍ التوليد',
  completed: 'مكتمل',
  failed: 'فشل',
  approved: 'معتمد',
  draft: 'مسودة',
  analyzing: 'قيد التحليل',
  review: 'بانتظار الاعتماد',
  generating: 'قيد التوليد',
}

function StageBody({ stage }: { stage: StageResult | undefined }) {
  if (!stage || !stage.output) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">هذه المرحلة لم تُولّد بعد.</p>
      </div>
    )
  }
  const o = stage.output as Record<string, unknown>
  switch (stage.stageId) {
    case 'brief':
      return <BriefStage output={o} />
    case 'concept':
      return <ConceptStage output={o} />
    case 'narrative':
      return <NarrativeStage output={o} />
    case 'beats':
      return <BeatsStage output={o} />
    case 'style-entities':
      return <StyleEntitiesStage output={o} />
    case 'storyboard':
      return <StoryboardStage output={o} />
    case 'shot-cards':
      return <ShotCardsStage output={o} />
    case 'image-prompts':
      return <ImagePromptsStage output={o} />
    case 'motion-prompts':
      return <MotionPromptsStage output={o} />
    case 'audio':
      return <AudioStage output={o} />
    case 'delivery':
      return <DeliveryStage output={o} />
    case 'final-prompt':
      return <FinalPromptStage output={o} />
    default:
      return <GenericStage output={o} />
  }
}

export function WorkspaceView() {
  const project = useAppStore((s) => s.project)
  const generation = useAppStore((s) => s.generation)
  const regenerateStage = useAppStore((s) => s.regenerateStage)
  const approveStage = useAppStore((s) => s.approveStage)
  const startGeneration = useAppStore((s) => s.startGeneration)
  const goHome = useAppStore((s) => s.goHome)
  const { toast } = useToast()

  const route = project?.route || 'full-production'
  const order = useMemo(() => stagesForRoute(route), [route])

  const [activeStageId, setActiveStageId] = useState<string | null>(null)
  const [regenDialog, setRegenDialog] = useState<{ stageId: string } | null>(null)
  const [regenNote, setRegenNote] = useState('')
  const [regenBusy, setRegenBusy] = useState(false)

  if (!project) return null

  const stagesMap = new Map(project.stages.map((s) => [s.stageId, s]))
  const activeId = activeStageId || order.find((sid) => { const rec = stagesMap.get(sid); return rec?.output }) || order[0]
  const active = stagesMap.get(activeId)
  const activeDef = getStageDefinition(activeId)

  const completedCount = order.filter((sid) => {
    const rec = stagesMap.get(sid)
    return rec && (rec.status === 'completed' || rec.status === 'approved')
  }).length
  const allDone = completedCount === order.length

  const doRegenerate = async () => {
    if (!regenDialog || regenNote.trim().length < 3) return
    setRegenBusy(true)
    const ok = await regenerateStage(regenDialog.stageId, regenNote.trim())
    setRegenBusy(false)
    setRegenDialog(null)
    setRegenNote('')
    toast(
      ok
        ? { title: 'تمت إعادة التوليد ✓', description: 'حُفظت النسخة السابقة في سجل الإصدارات.' }
        : { title: 'فشلت إعادة التوليد', description: 'أعد المحاولة بعد قليل — النسخة السابقة محفوظة.', variant: 'destructive' },
    )
  }

  const statusBadgeClass = (status?: string) =>
    status === 'completed' || status === 'approved'
      ? 'bg-success/10 text-success border-success/25'
      : status === 'failed'
        ? 'bg-danger/10 text-danger border-danger/25'
        : status === 'running'
          ? 'bg-warning/10 text-warning border-warning/25 animate-pulse-soft'
          : 'bg-muted text-muted-foreground'

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* الشريط العلوي */}
      <header className="shrink-0 border-b border-border/60 bg-surface/50 backdrop-blur-md z-30">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={goHome} className="grid place-items-center h-9 w-9 rounded-xl hover:bg-elevated transition-colors" aria-label="الرئيسية">
              <Logo size="sm" />
            </button>
            <Separator orientation="vertical" className="h-6" />
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{project.title}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {ROUTE_LABELS[route]} · {project.platform || ''} {project.durationSeconds ? `· ${project.durationSeconds}s` : ''} {project.aspectRatio ? `· ${project.aspectRatio}` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className={statusBadgeClass(project.status)}>
              {STATUS_LABELS[project.status] || project.status}
            </Badge>
            {allDone ? (
              <ExportButtons />
            ) : (
              <Button
                size="sm"
                onClick={() => void startGeneration()}
                disabled={generation.loopRunning}
                className="gap-1.5"
              >
                {generation.loopRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                {generation.loopRunning ? 'جارٍ التوليد…' : 'أكمل التوليد'}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0" dir="rtl">
        {/* الشريط الجانبي — المراحل */}
        <aside className="hidden md:block w-64 shrink-0 border-l border-border/60 bg-surface/30">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              <div className="px-3 py-2 text-[11px] text-muted-foreground">مراحل الإنتاج ({completedCount}/{order.length})</div>
              {order.map((sid) => {
                const rec = stagesMap.get(sid)
                const def = getStageDefinition(sid)
                const Icon = STAGE_ICONS[sid] || Zap
                const isActive = sid === activeId
                const running = generation.activeStage === sid && generation.loopRunning
                return (
                  <button
                    key={sid}
                    onClick={() => setActiveStageId(sid)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors ${
                      isActive
                        ? 'bg-brand-soft/60 text-foreground border border-brand/25'
                        : 'text-muted-foreground hover:bg-elevated/60 border border-transparent'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isActive ? 'bg-brand/20 text-brand' : 'bg-elevated/60'}`}>
                      {running ? <Loader2 className="h-4 w-4 text-brand animate-spin" /> : <Icon className={`h-4 w-4 ${isActive ? 'text-brand' : ''}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{def?.labelAr || sid}</div>
                      <div className="text-[10px] text-muted-foreground/70 truncate">
                        {rec ? STATUS_LABELS[rec.status] : 'قيد الانتظار'}
                        {rec && rec.version > 0 ? ` · v${rec.version}` : ''}
                      </div>
                    </div>
                    {rec && (rec.status === 'approved' ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : rec.status === 'failed' ? (
                      <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                    ) : rec.status === 'completed' ? (
                      <Check className="h-4 w-4 text-success/70 shrink-0" />
                    ) : null)}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* اللوحة الرئيسية */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
            {/* رأس المرحلة */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold">{activeDef?.labelAr || activeId}</h1>
                  {active && (
                    <Badge variant="secondary" className={statusBadgeClass(active.status)}>
                      {STATUS_LABELS[active.status]}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{activeDef?.descriptionAr}</p>
              </div>

              {active && (active.status === 'completed' || active.status === 'approved') && (
                <div className="flex items-center gap-2">
                  {active.status === 'completed' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => void approveStage(activeId)} className="gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            اعتمد
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>يثبت هذه النسخة كمرجع للمراحل التالية</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setRegenDialog({ stageId: activeId })} className="gap-1.5">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    أعد التوليد
                  </Button>
                </div>
              )}
            </div>

            {/* فشل المرحلة */}
            {active?.status === 'failed' && active.error && (
              <Card className="border-danger/30 bg-danger/5 mb-6">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-danger mb-1">تعذر توليد هذه المرحلة</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{active.error.message}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* جسم المرحلة */}
            <StageBody stage={active} />

            {/* التنقل بين المراحل */}
            <div className="mt-10 flex items-center justify-between">
              <div className="order-2">
                {(() => {
                  const idx = order.indexOf(activeId)
                  if (idx >= order.length - 1) return null
                  return (
                    <Button variant="ghost" size="sm" onClick={() => setActiveStageId(order[idx + 1])} className="gap-1.5 text-muted-foreground">
                      التالي: {getStageDefinition(order[idx + 1])?.labelAr}
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )
                })()}
              </div>
              <div className="order-1">
                {(() => {
                  const idx = order.indexOf(activeId)
                  if (idx <= 0) return null
                  return (
                    <Button variant="ghost" size="sm" onClick={() => setActiveStageId(order[idx - 1])} className="gap-1.5 text-muted-foreground">
                      <ChevronLeft className="h-4 w-4 rotate-180" />
                      السابق: {getStageDefinition(order[idx - 1])?.labelAr}
                    </Button>
                  )
                })()}
              </div>
            </div>
          </div>
        </main>

        {/* Inspector — نسخة مبسطة جانبية على الشاشات الكبيرة */}
        <aside className="hidden xl:block w-72 shrink-0 border-r border-border/60 bg-surface/30 overflow-y-auto">
          <div className="p-5 space-y-5">
            <div>
              <div className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1.5">
                <Info className="h-3 w-3" />
                بيانات المشروع
              </div>
              <div className="space-y-2.5 text-xs">
                <InspectorRow label="الفكرة" value={project.idea.slice(0, 140) + (project.idea.length > 140 ? '…' : '')} />
                {project.analysis?.summary && <InspectorRow label="ملخص النية" value={project.analysis.summary} />}
                <InspectorRow label="النبرة" value={project.tone || '—'} />
                <InspectorRow label="اللغة" value={project.language === 'ar' ? 'العربية' : project.language} />
                {project.targetAudience && <InspectorRow label="الجمهور" value={project.targetAudience} />}
                {project.visualStyle && <InspectorRow label="الاتجاه البصري" value={project.visualStyle} />}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-[11px] text-muted-foreground mb-2">آخر تحديث</div>
              <div className="text-xs text-muted-foreground">
                {new Date(project.updatedAt).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
            {active && active.version > 0 && (
              <>
                <Separator />
                <div>
                  <div className="text-[11px] text-muted-foreground mb-2">إصدار المرحلة</div>
                  <div className="font-mono text-xs text-cyan-brand" dir="ltr">v{active.version}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                    تُحفظ كل نسخة سابقة عند إعادة التوليد — يمكن الرجوع إليها من التصدير.
                  </p>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* حوار إعادة التوليد — يتطلب سببًا وفق FR-07 */}
      <Dialog open={regenDialog !== null} onOpenChange={(o) => !o && setRegenDialog(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-brand" />
              إعادة توليد «{getStageDefinition(regenDialog?.stageId || '')?.labelAr}»
            </DialogTitle>
            <DialogDescription>
              اكتب سببًا أو ملاحظة لتوجيه إعادة التوليد. سيُحفظ الإصدار الحالي في السجل تلقائيًا.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={regenNote}
            onChange={(e) => setRegenNote(e.target.value)}
            placeholder="مثال: اجعل النبرة أكثر حماسًا، وقلّل عدد اللقطات…"
            dir="rtl"
            className="min-h-24"
            aria-label="سبب إعادة التوليد"
          />
          <DialogFooter className="gap-2 sm:justify-start">
            <Button onClick={doRegenerate} disabled={regenBusy || regenNote.trim().length < 3} className="gap-1.5">
              {regenBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              {regenBusy ? 'جارٍ إعادة التوليد…' : 'أعد التوليد'}
            </Button>
            <Button variant="outline" onClick={() => setRegenDialog(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground/70 mb-0.5">{label}</div>
      <div className="leading-relaxed text-foreground/85">{value}</div>
    </div>
  )
}

function ExportButtons() {
  const exportUrl = useAppStore((s) => s.exportUrl)
  const { toast } = useToast()
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => {
          window.open(exportUrl('markdown'), '_blank')
          toast({ title: 'تصدير Markdown', description: 'يتم تنزيل الحزمة بصيغة md.' })
        }}
        className="gap-1.5"
      >
        <Download className="h-3.5 w-3.5" />
        Markdown
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          window.open(exportUrl('json'), '_blank')
          toast({ title: 'تصدير JSON', description: 'يتم تنزيل الحزمة مع الحالات والتبعيات.' })
        }}
        className="gap-1.5"
      >
        <Download className="h-3.5 w-3.5" />
        JSON
      </Button>
    </div>
  )
}
