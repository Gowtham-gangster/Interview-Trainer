'use client'

import { Check, Moon, Sun } from 'lucide-react'

import { useAppTheme } from '@/hooks/use-app-theme'
import { THEME_OPTIONS } from '@/lib/theme/constants'
import { cn } from '@/lib/utils'

const themeIcons = {
  light: Sun,
  dark: Moon,
} as const

export function ThemeSettings() {
  const { theme, setTheme, mounted } = useAppTheme()

  if (!mounted) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {THEME_OPTIONS.map((item) => (
          <div
            key={item.id}
            className="h-28 animate-pulse rounded-xl border bg-muted/40"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {THEME_OPTIONS.map((item) => {
        const Icon = themeIcons[item.id]
        const isActive = theme === item.id

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setTheme(item.id)}
            className={cn(
              'group relative flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-300 sm:p-4',
              'hover:border-primary/40 hover:bg-muted/30',
              isActive
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border/60 bg-card',
            )}
          >
            {isActive && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div
              className={cn(
                'mb-3 flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-300',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground group-hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <p className="font-medium">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.description}
            </p>

            <div
              className={cn(
                'mt-4 h-10 w-full overflow-hidden rounded-md border transition-colors duration-300',
                item.id === 'light'
                  ? 'border-border bg-gradient-to-br from-white to-slate-100'
                  : 'border-border bg-gradient-to-br from-slate-900 to-slate-950',
              )}
            >
              <div className="flex h-full items-center gap-1 px-2">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    item.id === 'light' ? 'bg-primary' : 'bg-primary/80',
                  )}
                />
                <span
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    item.id === 'light' ? 'bg-slate-200' : 'bg-white/10',
                  )}
                />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
