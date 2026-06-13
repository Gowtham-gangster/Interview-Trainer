import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme/constants'

/**
 * Blocking script injected before paint to prevent theme flash (FOUC).
 * Must stay inline — no imports from React.
 */
export function getThemeInitScript(): string {
  return `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var theme=t==='dark'?'dark':'light';var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(theme);root.style.colorScheme=theme;root.dataset.theme=theme;}catch(e){document.documentElement.classList.add(${JSON.stringify(DEFAULT_THEME)});document.documentElement.style.colorScheme=${JSON.stringify(DEFAULT_THEME)};}})();`
}
