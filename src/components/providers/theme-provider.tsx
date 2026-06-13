'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes/dist/types'

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from '@/lib/theme/constants'

type AppThemeProviderProps = Omit<ThemeProviderProps, 'themes' | 'defaultTheme'>

export function ThemeProvider({
  children,
  ...props
}: AppThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME}
      storageKey={THEME_STORAGE_KEY}
      themes={['light', 'dark']}
      enableSystem={false}
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
