'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { SettingsPanel } from '@/components/settings/settings-panel'
import { SettingsRow } from '@/components/settings/settings-row'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/use-logout'

export function ProfileAccountActions() {
  const [isDeleting, setIsDeleting] = useState(false)
  const { logout, isLoggingOut } = useLogout()

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your account permanently? All chats, profile data, and settings will be removed. This cannot be undone.'
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch('/api/users/account', { method: 'DELETE' })

      if (!response.ok) {
        let message = 'Failed to delete account'
        try {
          const body = (await response.json()) as { message?: string }
          if (body.message) message = body.message
        } catch {
          /* ignore */
        }
        throw new Error(message)
      }

      toast.success('Account deleted')
      await logout()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete account'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section id="account" className="scroll-mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign out or permanently remove your account from this app.
        </p>
      </div>

      <SettingsPanel
        title="Session & account"
        description="Log out of your current session or delete your account entirely."
      >
        <SettingsRow
          title="Log out"
          description="End your session on this device."
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logout()}
            disabled={isLoggingOut || isDeleting}
          >
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </Button>
        </SettingsRow>
        <SettingsRow
          title="Delete account"
          description="Permanently delete your account, chats, and all stored data."
          bordered={false}
        >
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void handleDeleteAccount()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete account'}
          </Button>
        </SettingsRow>
      </SettingsPanel>
    </section>
  )
}
