'use client'

import { Toaster as SonnerToaster } from 'sonner'

import { useAppTheme } from '@/hooks/use-app-theme'

export function ThemedToaster() {
  const { theme, mounted } = useAppTheme()

  return (
    <SonnerToaster
      position="top-right"
      theme={mounted ? theme : 'light'}
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
    />
  )
}
