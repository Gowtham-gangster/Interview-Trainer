'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { SettingsPanel } from '@/components/settings/settings-panel'
import { SettingsRow } from '@/components/settings/settings-row'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useAppData } from '@/hooks/use-app-data'

export function NotificationSettings() {
  const { data, updateSettings } = useAppData()
  const [isSaving, setIsSaving] = useState(false)
  const [prefs, setPrefs] = useState({
    sessionReminders: true,
    performanceUpdates: true,
    interviewTips: true,
    productUpdates: false,
    browserNotifications: false,
    soundAlerts: true,
  })

  useEffect(() => {
    if (!data?.settings) return
    setPrefs({
      sessionReminders: data.settings.interviewReminders,
      performanceUpdates: data.settings.emailNotifications,
      interviewTips: data.settings.pushNotifications,
      productUpdates: data.settings.productUpdates,
      browserNotifications: data.settings.browserNotifications,
      soundAlerts: data.settings.soundAlerts,
    })
  }, [data?.settings])

  const update = (key: keyof typeof prefs, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!data) return
    setIsSaving(true)
    try {
      updateSettings({
        ...data.settings,
        interviewReminders: prefs.sessionReminders,
        emailNotifications: prefs.performanceUpdates,
        pushNotifications: prefs.interviewTips,
        productUpdates: prefs.productUpdates,
        browserNotifications: prefs.browserNotifications,
        soundAlerts: prefs.soundAlerts,
      })
      toast.success('Notification preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsPanel
        title="Email Notifications"
        description="Choose which updates we send to your inbox."
        footer={
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save preferences'}
          </Button>
        }
      >
        <SettingsRow
          title="Session reminders"
          description="Get reminded to complete your daily practice."
        >
          <Switch
            checked={prefs.sessionReminders}
            onCheckedChange={(v) => update('sessionReminders', v)}
          />
        </SettingsRow>
        <SettingsRow
          title="Performance updates"
          description="Weekly summary of scores and progress."
        >
          <Switch
            checked={prefs.performanceUpdates}
            onCheckedChange={(v) => update('performanceUpdates', v)}
          />
        </SettingsRow>
        <SettingsRow
          title="Interview tips"
          description="Curated advice based on your weak areas."
        >
          <Switch
            checked={prefs.interviewTips}
            onCheckedChange={(v) => update('interviewTips', v)}
          />
        </SettingsRow>
        <SettingsRow
          title="Product updates"
          description="New features and platform announcements."
          bordered={false}
        >
          <Switch
            checked={prefs.productUpdates}
            onCheckedChange={(v) => update('productUpdates', v)}
          />
        </SettingsRow>
      </SettingsPanel>

      <SettingsPanel
        title="In-app Notifications"
        description="Control alerts while using the platform."
      >
        <SettingsRow
          title="Browser notifications"
          description="Show desktop alerts for session events."
        >
          <Switch
            checked={prefs.browserNotifications}
            onCheckedChange={(v) => update('browserNotifications', v)}
          />
        </SettingsRow>
        <SettingsRow
          title="Sound alerts"
          description="Play a sound when feedback is ready."
          bordered={false}
        >
          <Switch
            checked={prefs.soundAlerts}
            onCheckedChange={(v) => update('soundAlerts', v)}
          />
        </SettingsRow>
      </SettingsPanel>
    </div>
  )
}
