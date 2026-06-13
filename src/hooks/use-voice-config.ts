'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

import {
  DEFAULT_VOICE_CONFIG,
  loadVoiceConfig,
  saveVoiceConfig,
  type VoiceConfig,
} from '@/lib/voice/voice-config'

export function useVoiceConfig() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [config, setConfig] = useState<VoiceConfig>(DEFAULT_VOICE_CONFIG)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setConfig(loadVoiceConfig(userId))
    setMounted(true)
  }, [userId])

  useEffect(() => {
    if (!mounted) return

    void fetch('/api/voice/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((status: { speechToText?: { language?: string } } | null) => {
        const serverLanguage = status?.speechToText?.language?.trim()
        if (!serverLanguage) return

        setConfig((current) => {
          if (current.language !== DEFAULT_VOICE_CONFIG.language) return current
          const next = { ...current, language: serverLanguage }
          saveVoiceConfig(next, userId)
          return next
        })
      })
      .catch(() => {
        // Voice status is optional; local settings still work.
      })
  }, [mounted, userId])

  const updateConfig = useCallback(
    (patch: Partial<VoiceConfig>) => {
      setConfig((current) => {
        const next = { ...current, ...patch }
        saveVoiceConfig(next, userId)
        return next
      })
    },
    [userId]
  )

  return {
    config,
    updateConfig,
    mounted,
    isVoiceEnabled: mounted && config.enabled,
  }
}
