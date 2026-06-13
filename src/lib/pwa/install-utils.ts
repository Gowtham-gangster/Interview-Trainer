export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false

  const nav = window.navigator as Navigator & { standalone?: boolean }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    nav.standalone === true
  )
}

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false

  return (
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  )
}

export function canUseNativeInstallPrompt(
  deferredPrompt: BeforeInstallPromptEvent | null,
): boolean {
  return Boolean(deferredPrompt) && !isStandaloneDisplayMode()
}

export function shouldShowIosInstallHint(): boolean {
  return isIosDevice() && !isStandaloneDisplayMode()
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /android/i.test(window.navigator.userAgent)
}

export function isAndroidInstallableBrowser(): boolean {
  if (!isAndroidDevice()) return false

  const ua = window.navigator.userAgent
  return /Chrome|EdgA|SamsungBrowser|OPR/i.test(ua) && !/wv\)/i.test(ua)
}

export function serviceWorkerControlsPage(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  return Boolean(navigator.serviceWorker.controller)
}

const PWA_RELOAD_KEY = 'pwa-install-sw-reload'

/** Chrome on Android often needs one reload before install prompt is available. */
export async function ensureInstallablePage(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false

  await registerServiceWorker()
  await navigator.serviceWorker.ready

  if (serviceWorkerControlsPage()) return true

  await new Promise((resolve) => setTimeout(resolve, 800))

  if (serviceWorkerControlsPage()) return true

  if (isAndroidInstallableBrowser() && !sessionStorage.getItem(PWA_RELOAD_KEY)) {
    sessionStorage.setItem(PWA_RELOAD_KEY, '1')
    window.location.reload()
    return false
  }

  return serviceWorkerControlsPage()
}

export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false

  return (
    isIosDevice() ||
    isAndroidDevice() ||
    window.matchMedia('(max-width: 767px)').matches
  )
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    return await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
  } catch (error) {
    console.error('[pwa] Service worker registration failed:', error)
    return null
  }
}
