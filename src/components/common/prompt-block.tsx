'use client'

// كتلة برومبت واحدة قابلة للنسخ — PRD §8 FR-09 + frame-prompt-contract
// كل برومبت كتلة LTR أحادية العرض مستقلة، بلا أي تجميع يدوي.

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function CopyButton({ text, label = 'نسخ', className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({ title: 'تم النسخ ✓', description: 'البرومبت جاهز للصق في أداة التوليد.' })
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast({ title: 'تعذر النسخ', description: 'حدد النص وانسخه يدويًا.', variant: 'destructive' })
    }
  }

  return (
    <Button
      variant={copied ? 'secondary' : 'outline'}
      size="sm"
      onClick={copy}
      className={`gap-1.5 h-8 ${copied ? 'bg-success/10 text-success border-success/30' : ''} ${className || ''}`}
      aria-label={label}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'تم' : label}
    </Button>
  )
}

export function PromptBlock({
  title,
  badge,
  prompt,
  durationSeconds,
  meta,
}: {
  title: string
  badge?: string
  prompt: string
  durationSeconds?: number
  meta?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-elevated/60 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-border/70 bg-surface/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-xs text-cyan-brand" dir="ltr">{badge}</span>
          <h4 className="font-semibold text-sm truncate">{title}</h4>
          {durationSeconds ? (
            <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5" dir="ltr">
              {durationSeconds}s
            </span>
          ) : null}
        </div>
        <CopyButton text={prompt} />
      </div>
      <div className="prompt-block p-4 text-foreground/90 max-h-96 overflow-y-auto" dir="ltr">
        {prompt}
      </div>
      {meta && (
        <div className="px-4 py-2 border-t border-border/60 bg-surface/40 text-[11px] text-muted-foreground">{meta}</div>
      )}
    </div>
  )
}
