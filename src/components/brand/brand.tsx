'use client'

import { cn } from '@/lib/utils'
import { Clapperboard } from 'lucide-react'

export function Logo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' }[size]
  const icon = { sm: 16, md: 20, lg: 26 }[size]
  return (
    <div
      className={cn(
        'relative grid place-items-center rounded-xl bg-gradient-to-br from-brand to-cyan-brand brand-glow',
        dims,
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-xl bg-[#0B0D12]/20" />
      <Clapperboard size={icon} className="relative text-white" strokeWidth={2.2} />
    </div>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Logo size="md" />
      <div className="leading-tight">
        <div className="text-lg font-bold text-foreground">استوديو أفلام AI</div>
        <div className="text-[11px] text-muted-foreground tracking-wide">AI FILM STUDIO</div>
      </div>
    </div>
  )
}
