import { getThemeInitScript } from '@/lib/theme/theme-script'

export function ThemeScript() {
  return (
    <script
      id="theme-init"
      dangerouslySetInnerHTML={{ __html: getThemeInitScript() }}
    />
  )
}
