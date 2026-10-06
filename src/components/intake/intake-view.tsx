'use client'

// Project Intake — PRD §9 (الشاشة 2): Stepper بسيط، الحقول الضرورية فقط،
// معاينة لما سيولد. الحقول وفق PRD §8 FR-02.

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wordmark } from '@/components/brand/brand'
import { useToast } from '@/hooks/use-toast'
import { ArrowRight, ArrowLeft, Wand2, Loader2, ChevronRight } from 'lucide-react'

const PROJECT_TYPES = [
  { value: 'auto', label: 'تلقائي (يحدده الذكاء)', hint: 'النظام يختار المسار الأنسب لفكرتك' },
  { value: 'commercial', label: 'إعلان منتج / براند', hint: 'محرك الإعلانات مع Product Anchor وEnd Card' },
  { value: 'documentary', label: 'وثائقي / فيديو إسّي', hint: 'محرك الوثائقي مع سرد وكولاج أرشيفي' },
  { value: 'film', label: 'فيلم قصير / سردي', hint: 'المسار الكامل بكل المراحل' },
  { value: 'motion', label: 'موشن جرافيك', hint: 'بنية مشاهد نصية وعناصر متحركة' },
  { value: 'series', label: 'سلسلة / قناة', hint: 'توقيع بصري موحد وقالب حلقات' },
  { value: 'prompt', label: 'برومبت واحد سريع', hint: 'لقطة واحدة — برومبت نهائي مباشرة' },
]

const PLATFORMS = [
  { value: 'tiktok', label: 'تيك توك', ratio: '9:16', duration: 15 },
  { value: 'instagram-reels', label: 'ريلز إنستغرام', ratio: '9:16', duration: 30 },
  { value: 'youtube-shorts', label: 'يوتيوب شورتس', ratio: '9:16', duration: 60 },
  { value: 'youtube', label: 'يوتيوب', ratio: '16:9', duration: 90 },
  { value: 'x', label: 'إكس (تويتر)', ratio: '16:9', duration: 45 },
  { value: 'linkedin', label: 'لينكدإن', ratio: '1:1', duration: 60 },
]

const DURATIONS = [6, 10, 15, 30, 45, 60, 90, 120, 180]
const RATIOS = ['9:16', '16:9', '1:1', '4:5']
const TONES = ['سينمائي', 'حي ومرح', 'فخم وهادئ', 'درامي', 'تعبوي حماسي', 'وثائقي جاد', 'دافئ وإنساني']

export function IntakeView() {
  const createProject = useAppStore((s) => s.createProject)
  const analyze = useAppStore((s) => s.analyze)
  const setView = useAppStore((s) => s.setView)
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)

  const initialIdea = typeof window !== 'undefined' ? window.sessionStorage.getItem('afs-initial-idea') || '' : ''
  const [form, setForm] = useState({
    title: '',
    idea: initialIdea,
    projectType: 'auto',
    platform: 'tiktok',
    duration: 15,
    ratio: '9:16',
    tone: 'سينمائي',
    language: 'ar',
    audience: '',
    visualStyle: '',
    notes: '',
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const ideaOk = form.idea.trim().length >= 10

  const platformDefaults = (p: string) => {
    const plat = PLATFORMS.find((x) => x.value === p)
    if (plat) {
      set('duration', plat.duration)
      set('ratio', plat.ratio)
    }
  }

  const submit = async () => {
    if (!ideaOk) {
      setStep(1)
      return
    }
    setBusy(true)
    const created = await createProject({
      title: form.title.trim() || undefined,
      idea: form.idea.trim(),
      projectType: form.projectType,
      platform: form.platform,
      durationSeconds: form.duration,
      aspectRatio: form.ratio,
      language: form.language,
      tone: form.tone,
      targetAudience: form.audience.trim() || undefined,
      visualStyle: form.visualStyle.trim() || undefined,
      notes: form.notes.trim() || undefined,
    })
    if (!created) {
      toast({
        title: 'تعذر إنشاء المشروع',
        description: 'تحقق من اتصالك وأعد المحاولة.',
        variant: 'destructive',
      })
      setBusy(false)
      return
    }
    // انطلاق التحليل مباشرة
    await analyze()
    setBusy(false)
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

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 pb-24">
        {/* مؤشر الخطوات */}
        <div className="flex items-center justify-center gap-0 mb-10" dir="rtl">
          {['الفكرة', 'المواصفات', 'انطلاق'].map((label, i) => (
            <div key={label} className="flex items-center">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  step === i + 1
                    ? 'bg-brand text-white font-semibold'
                    : step > i + 1
                      ? 'bg-brand-soft text-brand'
                      : 'bg-surface text-muted-foreground'
                }`}
              >
                {step > i + 1 ? <Badge className="h-4 w-4 p-0 grid place-items-center bg-success text-white border-0">✓</Badge> : <span>{i + 1}</span>}
                {label}
              </div>
              {i < 2 && <ChevronRight className={`h-4 w-4 mx-1 ${step > i + 1 ? 'text-brand' : 'text-border'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <section className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300" dir="rtl">
            <div>
              <h1 className="text-2xl font-bold mb-2">ما هي فكرتك؟</h1>
              <p className="text-sm text-muted-foreground mb-4">اكتبها بحرية بالعربية أو الإنجليزية — الاستوديو سيفهمها ويقترح المسار الأنسب.</p>
              <Textarea
                value={form.idea}
                onChange={(e) => set('idea', e.target.value)}
                placeholder="مثال: إعلان 20 ثانية لتطبيق تعليمي للأطفال، ألوان مبهجة، ينتهي بدعوة تحميل…"
                className="min-h-40 text-base leading-relaxed"
                aria-label="فكرة الفيديو"
                autoFocus
              />
              {!ideaOk && form.idea.length > 0 && (
                <p className="text-xs text-warning mt-2">اكتب 10 أحرف على الأقل لفهم الفكرة.</p>
              )}
            </div>
            <div>
              <Label className="mb-2 block text-sm">عنوان المشروع (اختياري)</Label>
              <Input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="سيولد عنوان تلقائي إن تركته فارغًا"
                aria-label="عنوان المشروع"
              />
            </div>
            <div className="flex justify-start gap-3 pt-2">
              <Button size="lg" onClick={() => setStep(2)} disabled={!ideaOk} className="gap-2 font-semibold">
                التالي: المواصفات
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" dir="rtl">
            <div>
              <h1 className="text-2xl font-bold mb-1">مواصفات أساسية</h1>
              <p className="text-sm text-muted-foreground">نحتاج الحد الأدنى فقط — الذكاء يكمل الباقي ويمكنك تعديل كل شيء لاحقًا.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="mb-2.5 block text-sm font-semibold">نوع المشروع</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PROJECT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => set('projectType', t.value)}
                      className={`rounded-xl border p-3 text-right transition-all ${
                        form.projectType === t.value
                          ? 'border-brand bg-brand-soft/50 shadow-[0_0_25px_-12px_rgba(139,92,246,0.6)]'
                          : 'border-border bg-surface/40 hover:border-border/80 hover:bg-surface/70'
                      }`}
                      aria-pressed={form.projectType === t.value}
                    >
                      <div className="font-medium text-sm">{t.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-sm">المنصة المستهدفة</Label>
                <Select value={form.platform} onValueChange={(v) => { set('platform', v); platformDefaults(v) }}>
                  <SelectTrigger aria-label="المنصة"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label} — {p.ratio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm">المدة (ثانية)</Label>
                <Select value={String(form.duration)} onValueChange={(v) => set('duration', Number(v))}>
                  <SelectTrigger aria-label="المدة"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} ثانية</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm">نسبة العرض</Label>
                <Select value={form.ratio} onValueChange={(v) => set('ratio', v)}>
                  <SelectTrigger aria-label="النسبة"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RATIOS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm">النبرة</Label>
                <Select value={form.tone} onValueChange={(v) => set('tone', v)}>
                  <SelectTrigger aria-label="النبرة"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm">الجمهور المستهدف (اختياري)</Label>
                <Input value={form.audience} onChange={(e) => set('audience', e.target.value)} placeholder="مثال: شباب 18-30 مهتمون بالرياضة" aria-label="الجمهور" />
              </div>

              <div className="sm:col-span-2">
                <Label className="mb-2 block text-sm">اتجاه بصري مفضل (اختياري)</Label>
                <Input value={form.visualStyle} onChange={(e) => set('visualStyle', e.target.value)} placeholder="مثال: ألوان نيون داكنة، إضاءة سينمائية، ملمس فيلم 35mm" aria-label="الاتجاه البصري" />
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <Button variant="outline" size="lg" onClick={() => setStep(1)} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                رجوع
              </Button>
              <Button size="lg" onClick={() => setStep(3)} className="gap-2 font-semibold">
                التالي: المعاينة
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" dir="rtl">
            <div>
              <h1 className="text-2xl font-bold mb-1">جاهز للانطلاق</h1>
              <p className="text-sm text-muted-foreground">راجع الملخص، ثم سيحلل الاستوديو فكرتك ويعرض الاتجاه المقترح للاعتماد.</p>
            </div>

            <Card className="bg-surface/70">
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
                  <PreviewRow label="الفكرة" value={form.idea.slice(0, 120) + (form.idea.length > 120 ? '…' : '')} wide />
                  <PreviewRow label="النوع" value={PROJECT_TYPES.find((t) => t.value === form.projectType)?.label || form.projectType} />
                  <PreviewRow label="المنصة" value={PLATFORMS.find((p) => p.value === form.platform)?.label || form.platform} />
                  <PreviewRow label="المدة" value={`${form.duration} ثانية`} />
                  <PreviewRow label="النسبة" value={form.ratio} />
                  <PreviewRow label="النبرة" value={form.tone} />
                  {form.audience && <PreviewRow label="الجمهور" value={form.audience} />}
                  {form.visualStyle && <PreviewRow label="الاتجاه البصري" value={form.visualStyle} />}
                </div>

                <div className="rounded-xl border border-brand/25 bg-brand-soft/30 p-4">
                  <div className="text-sm font-semibold text-brand mb-2 flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    ما سيولّده الاستوديو
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {form.projectType === 'prompt'
                      ? 'برومبت واحد نهائي كامل وجاهز للنسخ مباشرة.'
                      : 'برييف إبداعي، الفكرة الكبرى، السرد، جدول الإيقاع، الهوية البصرية وأقفال الكيانات، الستوري بورد، بطاقات اللقطات، برومبت صورة كامل لكل فريم، برومبت حركة كامل لكل لقطة، خطة الصوت، وملخص التسليم والجودة.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between gap-3">
              <Button variant="outline" size="lg" onClick={() => setStep(2)} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                رجوع
              </Button>
              <Button size="lg" onClick={submit} disabled={busy} className="gap-2 font-semibold min-w-44">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {busy ? 'جارٍ التحليل…' : 'حلّل الفكرة وابدأ'}
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function PreviewRow({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="font-medium leading-relaxed">{value}</div>
    </div>
  )
}
