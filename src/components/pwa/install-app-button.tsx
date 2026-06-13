'use client'

import { Download, Loader2 } from 'lucide-react'

import { usePwaInstall } from '@/components/pwa/pwa-install-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InstallAppButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  label?: string
  showIcon?: boolean
  alwaysVisible?: boolean
  onAfterClick?: () => void
}

export function InstallAppButton({
  variant = 'outline',
  size = 'default',
  className,
  label = 'Install App',
  showIcon = true,
  alwaysVisible = false,
  onAfterClick,
}: InstallAppButtonProps) {
  const {
    isInstalling,
    isPreparing,
    canInstallNative,
    showInstallButton,
    install,
  } = usePwaInstall()

  if (!showInstallButton(alwaysVisible)) return null

  const busy = isInstalling || isPreparing
  const waitingForPrompt = !canInstallNative && !busy
  const buttonLabel = isInstalling
    ? 'Installing...'
    : isPreparing
      ? 'Preparing...'
      : waitingForPrompt
        ? 'Install App'
        : label

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn('gap-2', className)}
      disabled={busy || waitingForPrompt}
      onClick={() => {
        void install()
        onAfterClick?.()
      }}
      title={
        canInstallNative
          ? 'Install AI Interview Trainer'
          : 'Waiting for browser install support — stay on this page a moment'
      }
    >
      {busy || waitingForPrompt ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <Download className="h-4 w-4" />
      ) : null}
      {buttonLabel}
    </Button>
  )
}
