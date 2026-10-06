'use client'

// AI Film Studio Web — الصفحة الرئيسية (SPA)
// تتدفق عبر: landing → intake → review → progress → workspace

import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { LandingView } from '@/components/landing/landing-view'
import { IntakeView } from '@/components/intake/intake-view'
import { ReviewView } from '@/components/review/review-view'
import { ProgressView } from '@/components/progress/progress-view'
import { WorkspaceView } from '@/components/workspace/workspace-view'

export default function Home() {
  const view = useAppStore((s) => s.view)

  // استئناف آخر مشروع مفتوح عند العودة (استمرارية الجلسة)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const lastId = window.localStorage.getItem('afs-last-project')
    const store = useAppStore.getState()
    if (lastId) {
      void store.loadProject(lastId).then(() => {
        const p = useAppStore.getState().project
        if (!p) window.localStorage.removeItem('afs-last-project')
      })
    }
    const unsub = useAppStore.subscribe((s) => {
      if (s.project?.id) window.localStorage.setItem('afs-last-project', s.project.id)
    })
    return unsub
  }, [])

  switch (view) {
    case 'intake':
      return <IntakeView />
    case 'review':
      return <ReviewView />
    case 'progress':
      return <ProgressView />
    case 'workspace':
      return <WorkspaceView />
    default:
      return <LandingView />
  }
}
