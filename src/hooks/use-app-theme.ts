'use client'

import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { applyThemeTransition } from '@/lib/theme/apply-theme-transition'
import {
  DEFAULT_THEME,
  isAppTheme,
} from '@/lib/theme/constants'
import type { AppTheme } from '@/lib/theme/types'

export function useAppTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const activeTheme: AppTheme = useMemo(() => {
    const candidate = resolvedTheme ?? theme
    return isAppTheme(candidate) ? candidate : DEFAULT_THEME
  }, [resolvedTheme, theme])

  const setAppTheme = useCallback(
    (nextTheme: AppTheme) => {
      applyThemeTransition(() => {
        setTheme(nextTheme)
        document.documentElement.style.colorScheme = nextTheme
        document.documentElement.dataset.theme = nextTheme
      })
    },
    [setTheme],
  )

  const toggleTheme = useCallback(() => {
    setAppTheme(activeTheme === 'dark' ? 'light' : 'dark')
  }, [activeTheme, setAppTheme])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.style.colorScheme = activeTheme
    document.documentElement.dataset.theme = activeTheme
  }, [activeTheme, mounted])

  return {
    theme: activeTheme,
    setTheme: setAppTheme,
    toggleTheme,
    isDark: activeTheme === 'dark',
    isLight: activeTheme === 'light',
    mounted,
    systemTheme,
  }
}
