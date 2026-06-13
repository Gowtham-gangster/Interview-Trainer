'use client'

import { PageTransition } from '@/components/motion/page-transition'

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return <PageTransition>{children}</PageTransition>
}
