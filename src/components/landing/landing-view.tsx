'use client'

// صفحة الهبوط — PRD §9 (الشاشة 1: Landing / Home)
// قيمة المنتج في جملة، مربع فكرة كبير، أمثلة قابلة للاختيار، CTA، ومشاريع سابقة.

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Wordmark } from '@/components/brand/brand'
import {
  Sparkles,
  ArrowLeft,
  Clapperboard,
  Layers,
  Copy,
  Rocket,
  ShieldCheck,
  Film,
  Loader2,
  Clock,
  Globe,
  FolderOpen,
} from 'lucide-react'
import { ROUTE_LABELS } from '@/lib/domain/stages'
import type { ProjectSummary } from '@/types'

const EXAMPLES = [
  {
    title: 'إعلان مشروب طاقة',
    text: 'إعلان 15 ثانية لمشروب طاقة موجّه للشباب في تيك توك، إيقاع سريع، انفجار طاقة بصرية، وينتهي ببطاقة المنتج.',
  },
  {
    title: 'وثائقي قصير',
    text: 'وثائقي 60 ثانية عن تاريخ القهوة في اليمن بأسلوب كولاج أرشيفي هادئ مع تعليق صوتي عربي.',
  },
  {
    title: 'برومبت لقطة واحدة',
    text: 'أريد برومبت صورة واحد: مقهى صغير في صنعاء القديمة وقت الغروب، ضوء ذهبي دافئ يدخل من نافذة خشبية.',
  },
  {
    title: 'فيلم قصير',
    text: 'فيلم قصير 90 ثانية: طفل يجد مصباحًا قديمًا في سوق، لكن الأمنية تتحقق بطريقة غير متوقعة. نبرة سينمائية دافئة.',
  },
]

const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  analyzing: 'قيد التحليل',
  review: 'بانتظار الاعتماد',
  generating: 'قيد التوليد',
  completed: 'مكتمل',
  failed: 'فشل',
}

export function LandingView() {
  const openIntake = useAppStore((s) => s.openIntake)
  const fetchProjects = useAppStore((s) => s.fetchProjects)
  const projects = useAppStore((s) => s.projects)
  const booting = useAppStore((s) => s.booting)
  const loadProject = useAppStore((s) => s.loadProject)
  const [idea, setIdea] = useState('')

  useEffect(() => {
    void fetchProjects().finally(() => useAppStore.setState({ booting: false }))
  }, [fetchProjects])

  const submit = () => {
    if (idea.trim().length < 10) return
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('afs-initial-idea', idea.trim())
    }
    openIntake()
  }

  return (
    <div className="min-h-screen bg-background grid-noise">
      {/* شريط علوي */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Wordmark />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex gap-1.5 bg-brand-soft text-brand border-brand/20">
              <Sparkles className="h-3 w-3" />
              مدعوم بـ Gemini
            </Badge>
            <Button variant="outline" size="sm" onClick={() => openIntake()} className="gap-1.5">
              مشروع جديد
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        {/* البطل */}
        <section className="pt-14 sm:pt-20 pb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs text-muted-foreground mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            من فكرة واحدة إلى حزمة إنتاج كاملة — خلال دقائق
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-[1.25] tracking-tight">
            اكتب فكرتك…
            <span className="bg-gradient-to-l from-brand via-brand to-cyan-brand bg-clip-text text-transparent"> والاستوديو يتولى الباقي</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            برييف إبداعي، ستوري بورد، وبرومبت صورة وحركة كامل لكل لقطة — بهوية بصرية مقفلة واستمرارية تحترم منتجك وشخصياتك.
          </p>

          {/* مربع الفكرة الكبير */}
          <div className="mt-8 mx-auto max-w-2xl">
            <Card className="border-border/70 bg-surface/70 backdrop-blur transition-shadow focus-within:shadow-[0_0_50px_-18px_rgba(139,92,246,0.5)]">
              <CardContent className="p-2">
                <Textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="مثال: إعلان 15 ثانية لمشروب طاقة في تيك توك، إيقاع سريع ينتهي ببطاقة المنتج…"
                  className="min-h-32 resize-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                  aria-label="اكتب فكرة الفيديو"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
                  }}
                />
                <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-1">
                  <span className={`text-xs ${idea.trim().length >= 10 ? 'text-muted-foreground' : 'text-warning'}`}>
                    {idea.trim().length < 10 ? 'اكتب 10 أحرف على الأقل' : `${idea.trim().length} حرف — جاهز`}
                  </span>
                  <Button onClick={submit} disabled={idea.trim().length < 10} className="gap-2 font-semibold">
                    <Rocket className="h-4 w-4" />
                    حلّل الفكرة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* أمثلة */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.title}
                onClick={() => setIdea(ex.text)}
                className="group rounded-full border border-border bg-surface/50 px-4 py-2 text-xs text-muted-foreground hover:border-brand/40 hover:text-foreground hover:bg-brand-soft/40 transition-colors"
              >
                <span className="text-foreground/90 group-hover:text-brand font-medium">{ex.title}</span>
                <span className="mx-1.5 text-border">•</span>
                جرّبها
              </button>
            ))}
          </div>
        </section>

        {/* القيمة — ثلاث ميزات */}
        <section className="py-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Layers,
              title: 'خط إنتاج منظم',
              desc: '12 مرحلة إنتاج محترفة: من البرييف إلى برومبتات الصور والحركة وخطة الصوت والتسليم — كل مرحلة قابلة للاعتماد وإعادة التوليد وحدها.',
            },
            {
              icon: Copy,
              title: 'برومبت واحد لكل لقطة',
              desc: 'كل فريم يحصل برومبت كاملًا مستقلًا قابلًا للنسخ بضغطة واحدة — بلا تجميع يدوي، مع Style Lock وEntity Ledger يضمنان الاستمرارية.',
            },
            {
              icon: ShieldCheck,
              title: 'ذكاء خلف الخادم',
              desc: 'كل استدعاءات النموذج تمر عبر الخادم عبر طبقة مزود قابلة للاستبدال — مفاتيحك آمنة، وخيارك مفتوح بين المزودين لاحقًا.',
            },
          ].map((f) => (
            <Card key={f.title} className="bg-surface/60 border-border/70">
              <CardContent className="p-6">
                <div className="h-11 w-11 rounded-xl bg-brand-soft grid place-items-center mb-4">
                  <f.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* المشاريع الأخيرة */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-brand" />
              مشاريعك الأخيرة
            </h2>
          </div>

          {booting ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl shimmer" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed border-border/70 bg-transparent">
              <CardContent className="py-10 text-center text-muted-foreground">
                <Film className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">لا توجد مشاريع بعد. اكتب فكرتك في الأعلى لتنشئ أول مشروع.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((p) => (
                <ProjectCard key={p.id} project={p} onOpen={() => loadProject(p.id)} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* تذييل ثابت أسفل الشاشة */}
      <footer className="mt-auto border-t border-border/60 bg-surface/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" />
            واجهة عربية أصلية RTL — تدعم الهاتف وسطح المكتب
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> أول Concept خلال دقيقتين</span>
            <span>AI Film Studio v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ProjectCard({ project, onOpen }: { project: ProjectSummary; onOpen: () => void }) {
  const done = project.status === 'completed'
  return (
    <button onClick={onOpen} className="group text-right">
      <Card className="h-full bg-surface/60 border-border/70 hover:border-brand/40 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-brand transition-colors">{project.title}</h3>
            <Badge
              variant="secondary"
              className={
                done
                  ? 'bg-success/10 text-success border-success/20'
                  : project.status === 'failed'
                    ? 'bg-danger/10 text-danger border-danger/20'
                    : project.status === 'generating'
                      ? 'bg-warning/10 text-warning border-warning/20'
                      : 'bg-muted text-muted-foreground'
              }
            >
              {STATUS_LABELS[project.status] || project.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">{project.idea}</p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {project.route && <Clapperboard className="h-3 w-3 text-brand/70" />}
            <span className="line-clamp-1">{project.route ? ROUTE_LABELS[project.route] || project.route : 'غير موجّه'}</span>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}
