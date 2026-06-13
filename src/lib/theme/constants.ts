import type { AppTheme, ThemeOption } from '@/lib/theme/types'

export const THEME_STORAGE_KEY = 'ai-interview-trainer-theme'

export const THEME_TRANSITION_CLASS = 'theme-transition'

export const THEME_TRANSITION_MS = 300

export const DEFAULT_THEME: AppTheme = 'light'

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Clean and bright interface',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes in low light',
  },
]

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return value === 'light' || value === 'dark'
}

export function resolveStoredTheme(value: string | null | undefined): AppTheme {
  return isAppTheme(value) ? value : DEFAULT_THEME
}
