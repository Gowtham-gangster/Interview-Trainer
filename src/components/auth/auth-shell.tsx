import Link from 'next/link'
import { Sparkles } from 'lucide-react'

import { AuthBackground } from '@/components/auth/auth-background'
import { AuthBrandPanel } from '@/components/auth/auth-brand-panel'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { cn } from '@/lib/utils'

interface AuthShellProps {
  children: React.ReactNode
  className?: string
}

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100">
      <AuthBackground />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-wide">
              AI Interview Trainer
            </span>
          </Link>
          <ThemeToggle className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" />
        </div>

        <div
          className={cn(
            'flex flex-1 flex-col items-center justify-center',
            className,
          )}
        >
          <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
            <AuthBrandPanel />
            <div className="flex w-full items-center justify-center">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
