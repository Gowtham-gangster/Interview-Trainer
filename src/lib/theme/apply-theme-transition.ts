import {
  THEME_TRANSITION_CLASS,
  THEME_TRANSITION_MS,
} from '@/lib/theme/constants'

export function applyThemeTransition(update: () => void) {
  if (typeof document === 'undefined') {
    update()
    return
  }

  const root = document.documentElement
  root.classList.add(THEME_TRANSITION_CLASS)

  update()

  window.setTimeout(() => {
    root.classList.remove(THEME_TRANSITION_CLASS)
  }, THEME_TRANSITION_MS)
}
