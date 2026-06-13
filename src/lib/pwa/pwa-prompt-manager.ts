import type { BeforeInstallPromptEvent } from '@/lib/pwa/install-utils'

type PromptListener = () => void

declare global {
  interface Window {
    __PWA_DEFERRED_PROMPT__?: BeforeInstallPromptEvent | null
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<PromptListener>()
let initialized = false

function readWindowPrompt(): BeforeInstallPromptEvent | null {
  return window.__PWA_DEFERRED_PROMPT__ ?? null
}

function syncFromWindow(): void {
  const windowPrompt = readWindowPrompt()
  if (windowPrompt) {
    deferredPrompt = windowPrompt
  }
}

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export function initPwaPromptManager(): void {
  if (typeof window === 'undefined' || initialized) return

  initialized = true
  syncFromWindow()

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    const prompt = event as BeforeInstallPromptEvent
    deferredPrompt = prompt
    window.__PWA_DEFERRED_PROMPT__ = prompt
    notifyListeners()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    window.__PWA_DEFERRED_PROMPT__ = null
    notifyListeners()
  })

  window.addEventListener('pwa-installprompt-ready', () => {
    syncFromWindow()
    notifyListeners()
  })
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  if (!deferredPrompt) {
    syncFromWindow()
  }
  return deferredPrompt
}

export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null
  window.__PWA_DEFERRED_PROMPT__ = null
  notifyListeners()
}

export function subscribeInstallPrompt(listener: PromptListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function waitForInstallPrompt(
  timeoutMs = 4000
): Promise<BeforeInstallPromptEvent | null> {
  const existing = getDeferredInstallPrompt()
  if (existing) {
    return Promise.resolve(existing)
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener('pwa-installprompt-ready', onReady)
      unsubscribe()
      resolve(getDeferredInstallPrompt())
    }, timeoutMs)

    const onReady = () => {
      const prompt = getDeferredInstallPrompt()
      if (prompt) {
        window.clearTimeout(timeout)
        window.removeEventListener('pwa-installprompt-ready', onReady)
        unsubscribe()
        resolve(prompt)
      }
    }

    window.addEventListener('pwa-installprompt-ready', onReady)

    const unsubscribe = subscribeInstallPrompt(() => {
      const prompt = getDeferredInstallPrompt()
      if (prompt) {
        window.clearTimeout(timeout)
        window.removeEventListener('pwa-installprompt-ready', onReady)
        unsubscribe()
        resolve(prompt)
      }
    })
  })
}
