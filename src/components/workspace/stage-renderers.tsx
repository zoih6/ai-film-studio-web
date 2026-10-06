'use client'

// عارضات المراحل — مكوّن عرض لكل نوع مخرجات
// PRD §9 الشاشات 6-8 + FR-06 (مخرجات قابلة للاستخدام)

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PromptBlock, CopyButton } from '@/components/common/prompt-block'
import { Separator } from '@/components/ui/separator'
import { Copy } from 'lucide-react'

type Output = Record<string, unknown>

function Labeled({ label, value, mono }: { label: string; value: unknown; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-sm leading-relaxed whitespace-pre-wrap ${mono ? 'font-mono text-xs' : ''}`}>{String(value)}</div>
    </div>
  )
}

function Chips({ items, color = 'brand' }: { items: unknown; color?: 'brand' | 'cyan' | 'success' | 'warning' }) {
  const list = Array.isArray(items) ? items : []
  if (!list.length) return null
  const colors = {
    brand: 'bg-brand-soft text-brand border-brand/25',
    cyan: 'bg-cyan-brand/10 text-cyan-brand border-cyan-brand/25',
    success: 'bg-success/10 text-success border-success/25',
    warning: 'bg-warning/10 text-warning border-warning/25',
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((item, i) => (
        <Badge key={i} variant="secondary" className={colors[color]}>
          {String(item)}
        </Badge>
      ))}
    </div>
  )
}

function ListBlock({ title, items, icon }: { title: string; items: unknown; icon?: string }) {
  const list = Array.isArray(items) ? (items as string[]) : []
  if (!list.length) return null
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-2">{title}</div>
      <ul className="space-y-1.5">
        {list.map((item, i) => (
          <li key={i} className="text-sm text-foreground/85 flex gap-2 leading-relaxed">
            <span className="text-brand shrink-0">{icon || '•'}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------- Brief ----------
export function BriefStage({ output }: { output: Output }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Labeled label="عنوان العمل" value={output.title} />
        <Labeled label="الرسالة الأساسية" value={output.keyMessage} />
        <Labeled label="الهدف" value={output.objective} />
        <Labeled label="الجمهور" value={output.audience} />
        <Labeled label="ملاحظات المنصة" value={output.platformNotes} />
      </div>
      <Separator />
      <ListBlock title="المخرجات المطلوبة" items={output.deliverables} />
      <ListBlock title="القيود" items={output.constraints} />
      <ListBlock title="المخاطر" items={output.risks} icon="⚠" />
    </div>
  )
}

// ---------- Concept ----------
export function ConceptStage({ output }: { output: Output }) {
  return (
    <div className="space-y-6">
      <Card className="border-brand/25 bg-brand-soft/20">
        <CardContent className="p-6">
          <div className="text-xs text-brand mb-2">الفكرة الكبرى</div>
          <p className="text-lg font-bold leading-relaxed">{String(output.bigIdea || '')}</p>
        </CardContent>
      </Card>
      <div className="grid gap-5 sm:grid-cols-2">
        <Labeled label="اللوقلاين" value={output.logline} />
        <Labeled label="الخطاف الإبداعي" value={output.hook} />
        <Labeled label="الاستعارة البصرية" value={output.visualMetaphor} />
        <Labeled label="ملاحظات النبرة" value={output.toneNotes} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-2">كلمات المزاج</div>
        <Chips items={output.moodKeywords} color="cyan" />
      </div>
    </div>
  )
}

// ---------- Narrative ----------
export function NarrativeStage({ output }: { output: Output }) {
  const vo = String(output.voiceover || '')
  return (
    <div className="space-y-6">
      <ListBlock title="بنية السرد" items={output.structure} icon="→" />
      <div>
        <div className="text-xs text-muted-foreground mb-2">السكربت</div>
        <div className="rounded-xl border border-border bg-surface/50 p-5 text-sm leading-loose whitespace-pre-wrap">
          {String(output.script || '')}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">نص التعليق الصوتي</div>
          {vo && <CopyButton text={vo} label="نسخ النص" />}
        </div>
        <div className="rounded-xl border border-cyan-brand/25 bg-cyan-brand/5 p-5 text-sm leading-loose whitespace-pre-wrap">
          {vo}
        </div>
      </div>
      {output.cta ? <Labeled label="دعوة الفعل" value={output.cta} /> : null}
    </div>
  )
}

// ---------- Beats ----------
export function BeatsStage({ output }: { output: Output }) {
  const beats = (output.beats as Output[] | undefined) || []
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge className="bg-brand text-white border-0">المدة الكلية</Badge>
        <span className="font-mono font-semibold" dir="ltr">{String(output.totalDurationSeconds || 0)}s</span>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface/70">
              <TableHead className="text-right w-14">#</TableHead>
              <TableHead className="text-right">الوظيفة</TableHead>
              <TableHead className="text-right w-24">الثواني</TableHead>
              <TableHead className="text-right">ما يُرى</TableHead>
              <TableHead className="text-right">ما يُسمع</TableHead>
              <TableHead className="text-right">الانتقال</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beats.map((b, i) => (
              <TableRow key={i} className="bg-background/40">
                <TableCell className="font-mono text-cyan-brand" dir="ltr">{String(b.id || i + 1)}</TableCell>
                <TableCell className="font-medium text-sm">{String(b.purpose || '')}</TableCell>
                <TableCell className="font-mono text-xs" dir="ltr">
                  {String(b.startSeconds ?? '')}–{String((Number(b.startSeconds) || 0) + (Number(b.durationSeconds) || 0))}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs leading-relaxed">{String(b.visual || '')}</TableCell>
                <TableCell className="text-muted-foreground text-xs leading-relaxed">{String(b.audio || '')}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{String(b.transition || '')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ---------- Style & Entities ----------
export function StyleEntitiesStage({ output }: { output: Output }) {
  const styleLock = String(output.styleLock || '')
  const dna = (output.styleDna as Output) || {}
  const entities = (output.entities as Output[]) || []
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">Style Lock — يُمرر حرفيًا في كل برومبت</div>
          {styleLock && <CopyButton text={styleLock} label="نسخ القفل" />}
        </div>
        <div className="rounded-xl border border-brand/30 bg-brand-soft/20 p-4 text-sm leading-relaxed prompt-rtl">
          {styleLock}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-surface/50">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-2">لوحة الألوان</div>
            <Chips items={dna.palette} color="cyan" />
          </CardContent>
        </Card>
        <div className="space-y-3">
          <Labeled label="الإضاءة" value={dna.lighting} />
          <Labeled label="الملمس" value={dna.texture} />
          <Labeled label="شخصية الكاميرا" value={dna.cameraCharacter} />
          <Labeled label="شخصية الحركة" value={dna.motionCharacter} />
        </div>
      </div>

      {output.productAnchor ? (
        <Card className="border-warning/25 bg-warning/5">
          <CardContent className="p-4">
            <div className="text-xs text-warning mb-1.5">Product Anchor — هوية المنتج الحرفية</div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed">{String(output.productAnchor)}</p>
              <CopyButton text={String(output.productAnchor)} label="نسخ" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {entities.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-3">سجل الكيانات (Entity Ledger)</div>
          <div className="space-y-3">
            {entities.map((e, i) => (
              <Card key={i} className="bg-surface/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-cyan-brand bg-cyan-brand/10 rounded px-1.5 py-0.5" dir="ltr">
                        {String(e.id || '')}
                      </span>
                      <span className="font-semibold text-sm">{String(e.name || '')}</span>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">{String(e.kind || '')}</Badge>
                    </div>
                    <CopyButton text={String(e.identityString || '')} label="نسخ الهوية" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed prompt-rtl">{String(e.identityString || '')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Storyboard ----------
export function StoryboardStage({ output }: { output: Output }) {
  const scenes = (output.scenes as Output[]) || []
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-elevated gap-1.5" dir="ltr">{String(output.aspectRatio || '')}</Badge>
        <Badge variant="secondary" className="bg-elevated gap-1.5" dir="ltr">{String(output.totalDurationSeconds || 0)}s</Badge>
        <Badge variant="secondary" className="bg-elevated">{scenes.length} مشاهد</Badge>
      </div>
      {scenes.map((scene, si) => {
        const frames = (scene.frames as Output[]) || []
        return (
          <Card key={si} className="bg-surface/40 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border/60 bg-surface/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs text-cyan-brand" dir="ltr">{String(scene.sceneId || '')}</span>
                <h4 className="font-semibold text-sm">{String(scene.title || '')}</h4>
              </div>
              <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] max-w-48 truncate">{String(scene.purpose || '')}</Badge>
            </div>
            <CardContent className="p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {frames.map((f, fi) => (
                  <div key={fi} className="rounded-xl border border-border/70 bg-elevated/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-cyan-brand" dir="ltr">{String(f.frameId || '')}</span>
                        <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">{String(f.shotId || '')}</span>
                      </div>
                      <span className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground font-mono" dir="ltr">
                        {String(f.durationSeconds || '')}s
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/85 mb-3">{String(f.visualDescription || '')}</p>
                    <div className="space-y-1.5 text-[11px] text-muted-foreground">
                      <div><span className="text-brand/70">من:</span> {String(f.startState || '')}</div>
                      <div><span className="text-brand/70">إلى:</span> {String(f.endState || '')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ---------- Shot Cards ----------
export function ShotCardsStage({ output }: { output: Output }) {
  const shots = (output.shots as Output[]) || []
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {shots.map((s, i) => (
        <Card key={i} className="bg-surface/50">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-cyan-brand" dir="ltr">{String(s.shotId || '')}</span>
              <span className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground font-mono" dir="ltr">
                {String(s.durationSeconds || '')}s
              </span>
            </div>
            <div className="text-sm leading-relaxed font-medium">{String(s.frameDescription || '')}</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-elevated/50 p-2"><span className="text-muted-foreground block mb-0.5">الهدف</span>{String(s.goal || '')}</div>
              <div className="rounded-lg bg-elevated/50 p-2"><span className="text-muted-foreground block mb-0.5">الكاميرا</span>{String(s.camera || '')}</div>
              <div className="rounded-lg bg-elevated/50 p-2"><span className="text-muted-foreground block mb-0.5">الحركة</span>{String(s.movement || '')}</div>
              <div className="rounded-lg bg-elevated/50 p-2"><span className="text-muted-foreground block mb-0.5">الصوت</span>{String(s.audioHint || '')}</div>
            </div>
            {s.references && s.references !== 'none' ? (
              <div className="text-[11px] text-muted-foreground"><span className="text-brand/70">مراجع:</span> {String(s.references)}</div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---------- Image / Motion Prompts ----------
export function ImagePromptsStage({ output }: { output: Output }) {
  const prompts = (output.prompts as Output[]) || []
  const allText = prompts.map((p) => String(p.prompt || '')).join('\n\n---\n\n')
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{prompts.length}</span> برومبت كامل — كل فريم له برومبت مستقل
          {output.targetModel && output.targetModel !== 'any' ? <span className="text-cyan-brand text-xs mr-2" dir="ltr">({String(output.targetModel)})</span> : null}
        </div>
        {allText && <CopyButton text={allText} label="نسخ الكل" />}
      </div>
      {prompts.map((p, i) => (
        <PromptBlock
          key={i}
          badge={String(p.frameId || p.shotId || `#${i + 1}`)}
          title={String(p.title || '')}
          prompt={String(p.prompt || '')}
          meta={p.shotId ? `shot: ${String(p.shotId)}` : undefined}
        />
      ))}
    </div>
  )
}

export function MotionPromptsStage({ output }: { output: Output }) {
  const prompts = (output.prompts as Output[]) || []
  const allText = prompts.map((p) => String(p.prompt || '')).join('\n\n---\n\n')
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{prompts.length}</span> برومبت تحريك — لكل لقطة برومبت مستقل
        </div>
        {allText && <CopyButton text={allText} label="نسخ الكل" />}
      </div>
      {prompts.map((p, i) => (
        <PromptBlock
          key={i}
          badge={String(p.shotId || `#${i + 1}`)}
          title={String(p.title || '')}
          prompt={String(p.prompt || '')}
          durationSeconds={p.durationSeconds ? Number(p.durationSeconds) : undefined}
          meta={[p.firstFrameRole, p.lastFrameRole].filter(Boolean).length ? `أول فريم: ${String(p.firstFrameRole || '-')} · آخر فريم: ${String(p.lastFrameRole || '-')}` : undefined}
        />
      ))}
    </div>
  )
}

// ---------- Audio ----------
export function AudioStage({ output }: { output: Output }) {
  const vo = (output.voiceover as Output) || {}
  const music = (output.music as Output) || {}
  const sfx = (output.sfx as Output[]) || []
  return (
    <div className="space-y-6">
      <Card className="border-cyan-brand/25 bg-cyan-brand/5">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm flex items-center gap-2">🎙️ التعليق الصوتي</div>
            {vo.fullScript ? <CopyButton text={String(vo.fullScript)} label="نسخ السكربت" /> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div><span className="text-muted-foreground">التوجيه:</span> {String(vo.direction || '')}</div>
            <div><span className="text-muted-foreground">اللغة:</span> {String(vo.language || '')}</div>
          </div>
          {vo.fullScript ? (
            <div className="rounded-lg bg-background/40 p-4 text-sm leading-loose whitespace-pre-wrap">{String(vo.fullScript)}</div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-surface/50">
        <CardContent className="p-5 grid gap-3 sm:grid-cols-3 text-sm">
          <Labeled label="توجيه الموسيقى" value={music.direction} />
          <Labeled label="BPM" value={music.bpm} mono />
          <Labeled label="مرجع" value={music.reference} />
        </CardContent>
      </Card>

      {sfx.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-2">المؤثرات الصوتية</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {sfx.map((s, i) => (
              <div key={i} className="rounded-lg border border-border/70 bg-surface/40 px-4 py-2.5 flex items-center gap-3 text-sm">
                <span className="font-mono text-xs text-cyan-brand" dir="ltr">{String(s.beat || '')}</span>
                <span className="text-muted-foreground text-xs leading-relaxed">{String(s.sound || '')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Labeled label="ملاحظات المكس" value={output.mixNotes} />
    </div>
  )
}

// ---------- Delivery ----------
export function DeliveryStage({ output }: { output: Output }) {
  const specs = (output.exportSpecs as Output) || {}
  const gates = (output.qualityGates as Output[]) || []
  const statusColor: Record<string, string> = {
    pass: 'bg-success/10 text-success border-success/25',
    warn: 'bg-warning/10 text-warning border-warning/25',
    fail: 'bg-danger/10 text-danger border-danger/25',
  }
  const statusLabel: Record<string, string> = { pass: 'ناجح', warn: 'تحذير', fail: 'فشل' }
  return (
    <div className="space-y-6">
      <Card className="bg-surface/50">
        <CardContent className="p-5">
          <div className="text-xs text-muted-foreground mb-3">مواصفات التصدير</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            {[
              ['الدقة', specs.resolution],
              ['الإطارات', specs.fps],
              ['الصيغة', specs.format],
              ['النسبة', specs.aspectRatio],
              ['الحجم', specs.maxFileSizeMb],
            ].map(([label, val]) =>
              val ? (
                <div key={String(label)} className="rounded-xl bg-elevated/50 p-3">
                  <div className="text-[11px] text-muted-foreground mb-1">{String(label)}</div>
                  <div className="font-mono text-sm font-semibold" dir="ltr">{String(val)}</div>
                </div>
              ) : null,
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="text-xs text-muted-foreground mb-3">بوابات الجودة</div>
        <div className="space-y-2">
          {gates.map((g, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface/40 px-4 py-3">
              <Badge variant="secondary" className={statusColor[String(g.status)] || ''}>{statusLabel[String(g.status)] || String(g.status)}</Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" dir="auto">{String(g.gate || '')}</div>
                {g.note ? <div className="text-xs text-muted-foreground mt-0.5">{String(g.note)}</div> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ListBlock title="قائمة الفحص النهائية" items={output.checklist} icon="✓" />
      <ListBlock title="تحذيرات" items={output.warnings} icon="⚠" />
    </div>
  )
}

// ---------- Final Prompt (shortcut) ----------
export function FinalPromptStage({ output }: { output: Output }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge className="bg-brand text-white border-0">{String(output.targetUse || '')}</Badge>
        <span className="font-semibold text-sm">{String(output.title || '')}</span>
      </div>
      <PromptBlock badge="FINAL" title={String(output.title || 'البرومبت النهائي')} prompt={String(output.prompt || '')} />
      {output.negativePrompt ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">Negative Prompt</div>
            <CopyButton text={String(output.negativePrompt)} label="نسخ" />
          </div>
          <div className="prompt-block rounded-xl border border-danger/25 bg-danger/5 p-4 text-foreground/85" dir="ltr">
            {String(output.negativePrompt)}
          </div>
        </div>
      ) : null}
      {output.notes ? <Labeled label="ملاحظات" value={output.notes} /> : null}
    </div>
  )
}

// ---------- Fallback ----------
export function GenericStage({ output }: { output: Output }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto flex-1 bg-surface/40 rounded-xl p-4" dir="ltr">
        {JSON.stringify(output, null, 2)}
      </pre>
      <div className="shrink-0">
        <CopyButton text={JSON.stringify(output, null, 2)} label="نسخ JSON" />
        <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1"><Copy className="h-3 w-3" /> تنسيق خام</div>
      </div>
    </div>
  )
}
