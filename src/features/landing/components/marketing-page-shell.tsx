import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'

import { ThemeToggle } from '@/components/layout/theme-toggle'

interface MarketingPageShellProps {
  title: string
  children: React.ReactNode
}

export function MarketingPageShell({
  title,
  children,
}: MarketingPageShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#070d1f] dark:text-white">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-white/5 dark:bg-[#070d1f]/90">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-wide">
              AI Interview Trainer
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 transition-colors hover:text-cyan-600 sm:text-sm dark:text-slate-400 dark:hover:text-cyan-400"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline">Back to home</span>
              <span className="xs:hidden">Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12 lg:px-8 lg:py-16">
        <h1 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 md:text-4xl">
          {title}
        </h1>
        <div className="prose prose-slate dark:prose-invert mt-8 max-w-none space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {children}
        </div>
      </main>
    </div>
  )
}
