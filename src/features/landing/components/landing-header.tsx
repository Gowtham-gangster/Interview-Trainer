'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

import { ThemeToggle } from '@/components/layout/theme-toggle'
import { InstallAppButton } from '@/components/pwa/install-app-button'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

const mobileMenuLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Why Choose Us', href: '#why-choose' },
]

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-[#070d1f]/80"
    >
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:py-4 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25"
          >
            <Sparkles className="h-4 w-4 text-white" />
          </motion.div>
          <span className="truncate text-sm font-semibold tracking-wide transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
            AI Interview Trainer
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" />

          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:text-slate-900 sm:inline-flex dark:text-slate-300 dark:hover:text-white"
          >
            Sign in
          </Link>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="hidden sm:block"
          >
            <Link
              href="/register"
              className="inline-flex rounded-lg bg-gradient-to-b from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/25 transition-shadow hover:shadow-cyan-500/40"
            >
              Sign up
            </Link>
          </motion.div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[min(100vw-2rem,320px)] p-0">
          <div className="border-b px-4 py-4 pr-12">
            <SheetTitle className="text-sm font-semibold">Menu</SheetTitle>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {mobileMenuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <InstallAppButton
              alwaysVisible
              variant="ghost"
              className="h-auto w-full justify-start rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
              onAfterClick={() => setMenuOpen(false)}
            />
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white"
            >
              Sign up
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </motion.header>
  )
}
