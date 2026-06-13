'use client'

import { useEffect } from 'react'

import { registerServiceWorker } from '@/lib/pwa/install-utils'
import { initPwaPromptManager } from '@/lib/pwa/pwa-prompt-manager'

export function PwaRegister() {
  useEffect(() => {
    initPwaPromptManager()

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (process.env.NODE_ENV === 'development' && !isLocalhost) return

    void registerServiceWorker()
  }, [])

  return null
}
