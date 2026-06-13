'use client'

import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'

import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { PwaInstallProvider } from '@/components/pwa/pwa-install-provider'
import { PwaRegister } from '@/components/pwa/pwa-register'
import { TooltipProvider } from '@/components/ui/tooltip'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <ThemeProvider>
        <QueryProvider>
          <TooltipProvider>
            <PwaInstallProvider>
              <PwaRegister />
              {children}
            </PwaInstallProvider>
          </TooltipProvider>
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
