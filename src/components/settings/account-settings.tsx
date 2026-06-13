'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { SettingsPanel } from '@/components/settings/settings-panel'
import { SettingsRow } from '@/components/settings/settings-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAppData } from '@/hooks/use-app-data'

export function AccountSettings() {
  const { data: session } = useSession()
  const { data, updateProfile, resetData } = useAppData()
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [twoFactor, setTwoFactor] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isEmailChanging =
    Boolean(data?.profile.email) &&
    email.trim().toLowerCase() !== data?.profile.email.trim().toLowerCase()

  useEffect(() => {
    setEmail(data?.profile.email ?? session?.user?.email ?? '')
  }, [data?.profile.email, session?.user?.email])

  const handleSaveEmail = async () => {
    if (!data?.profile) return

    if (isEmailChanging && !currentPassword.trim()) {
      toast.error('Enter your current password to change your email address.')
      return
    }

    setIsSaving(true)
    try {
      const result = await updateProfile(
        { ...data.profile, email },
        isEmailChanging ? { currentPassword } : undefined
      )
      if (result?.emailChangeSent && result.pendingEmail) {
        toast.success(`Verification link sent to ${result.pendingEmail}`)
      } else {
        toast.success('Account settings updated')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update account'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordReset = () => {
    toast.info('Password reset link sent to your email')
  }

  const handleExportData = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ai-interview-trainer-export.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Data export downloaded')
  }

  const handleDeleteAccount = () => {
    resetData()
    toast.success('Local account data reset')
  }

  return (
    <div className="space-y-6">
      <SettingsPanel
        title="Account Information"
        description="Update your login credentials and security options."
        footer={
          <Button onClick={handleSaveEmail} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save account'}
          </Button>
        }
      >
        <div className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="account-email">Email address</Label>
            <Input
              id="account-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-md"
            />
          </div>
          {isEmailChanging ? (
            <div className="space-y-2">
              <Label htmlFor="account-current-password">Current password</Label>
              <Input
                id="account-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Required to send a verification link to your new email address.
              </p>
            </div>
          ) : null}
          <Button type="button" variant="outline" onClick={handlePasswordReset}>
            Change password
          </Button>
        </div>

        <SettingsRow
          title="Two-factor authentication"
          description="Add an extra layer of security to your account."
          bordered={false}
        >
          <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
        </SettingsRow>
      </SettingsPanel>

      <SettingsPanel
        title="Data & Privacy"
        description="Manage your personal data and account lifecycle."
      >
        <SettingsRow
          title="Export data"
          description="Download your profile, reports, and settings."
        >
          <Button variant="outline" onClick={handleExportData}>
            Export JSON
          </Button>
        </SettingsRow>
        <SettingsRow
          title="Reset local data"
          description="Clear saved profile, reports, and module progress on this device."
          bordered={false}
        >
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Reset data
          </Button>
        </SettingsRow>
      </SettingsPanel>
    </div>
  )
}
