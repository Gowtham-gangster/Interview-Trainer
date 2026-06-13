'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { UserNav } from './user-nav'
interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onMenuClick ? (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        ) : null}

        <Link
          href="/chat"
          prefetch
          aria-label="Go to chat"
          className="truncate text-xs font-semibold transition-colors hover:text-primary sm:text-sm md:text-base"
        >
          AI Interview Trainer
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  )
}
