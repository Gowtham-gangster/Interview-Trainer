'use client'

import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAppTheme } from '@/hooks/use-app-theme'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useAppTheme()

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-9 w-9', className)}
        disabled
      >
        <Sun className="h-5 w-5 opacity-50" />
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('relative h-9 w-9', className)}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <Sun
        className={cn(
          'h-5 w-5 transition-all duration-300',
          theme === 'dark' && 'rotate-90 scale-0 opacity-0',
        )}
      />
      <Moon
        className={cn(
          'absolute h-5 w-5 transition-all duration-300',
          theme === 'light' && '-rotate-90 scale-0 opacity-0',
        )}
      />
    </Button>
  )
}
