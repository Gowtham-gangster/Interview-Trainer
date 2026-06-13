'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  canUseNativeInstallPrompt,
  ensureInstallablePage,
  isAndroidDevice,
  isAndroidInstallableBrowser,
  isIosDevice,
  isStandaloneDisplayMode,
} from '@/lib/pwa/install-utils'
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  initPwaPromptManager,
  subscribeInstallPrompt,
  waitForInstallPrompt,
} from '@/lib/pwa/pwa-prompt-manager'

interface PwaInstallContextValue {
  canInstallNative: boolean
  isInstalled: boolean
  isInstalling: boolean
  isPreparing: boolean
  install: () => Promise<boolean>
  showInstallButton: (alwaysVisible: boolean) => boolean
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null)

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [hasNativePrompt, setHasNativePrompt] = useState(false)

  useEffect(() => {
    initPwaPromptManager()

    const sync = () => {
      setIsInstalled(isStandaloneDisplayMode())
      setHasNativePrompt(canUseNativeInstallPrompt(getDeferredInstallPrompt()))
    }

    sync()

    const prepare = async () => {
      const ready = await ensureInstallablePage()
      if (!ready) return

      const waitMs = isAndroidDevice() ? 15000 : 8000
      await waitForInstallPrompt(waitMs)
      sync()
    }

    void prepare()

    return subscribeInstallPrompt(sync)
  }, [])

  const install = useCallback(async () => {
    if (isInstalled) return false

    try {
      setIsPreparing(true)

      const pageReady = await ensureInstallablePage()
      if (!pageReady) return false

      let prompt = getDeferredInstallPrompt()

      if (!prompt) {
        const waitMs = isAndroidDevice() ? 12000 : 5000
        prompt = await waitForInstallPrompt(waitMs)
      }

      if (!prompt) {
        return false
      }

      setIsPreparing(false)
      setIsInstalling(true)

      await prompt.prompt()
      const choice = await prompt.userChoice
      const accepted = choice.outcome === 'accepted'

      if (accepted) {
        setIsInstalled(true)
        clearDeferredInstallPrompt()
      }

      return accepted
    } catch {
      return false
    } finally {
      setIsInstalling(false)
      setIsPreparing(false)
    }
  }, [isInstalled])

  const canInstallNative = hasNativePrompt && !isInstalled

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      canInstallNative,
      isInstalled,
      isInstalling,
      isPreparing,
      install,
      showInstallButton: (alwaysVisible: boolean) => {
        if (isInstalled) return false
        if (canInstallNative) return true
        if (!alwaysVisible) return false
        if (isIosDevice()) return false
        return isAndroidInstallableBrowser()
      },
    }),
    [canInstallNative, install, isInstalled, isInstalling, isPreparing]
  )

  return (
    <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>
  )
}

export function usePwaInstall(): PwaInstallContextValue {
  const context = useContext(PwaInstallContext)
  if (!context) {
    throw new Error('usePwaInstall must be used within PwaInstallProvider')
  }
  return context
}
