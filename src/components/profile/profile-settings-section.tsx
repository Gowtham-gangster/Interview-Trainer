'use client'

import { Bell, Mic, Monitor, Shield } from 'lucide-react'

import { NotificationSettings } from '@/components/settings/notification-settings'
import { ProfileDataSettings } from '@/components/profile/profile-data-settings'
import { SettingsPanel } from '@/components/settings/settings-panel'
import { ThemeSettings } from '@/components/settings/theme-settings'
import { VoiceSettings } from '@/components/settings/voice-settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const tabs = [
  { value: 'appearance', label: 'Appearance', icon: Monitor },
  { value: 'voice', label: 'Voice', icon: Mic },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'privacy', label: 'Privacy', icon: Shield },
] as const

export function ProfileSettingsSection() {
  return (
    <section id="preferences" className="scroll-mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Theme, voice, notifications, and privacy settings for your account.
        </p>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList
          className={cn(
            'mb-2 flex h-auto w-full max-w-full flex-nowrap justify-start gap-2',
            'overflow-x-auto rounded-none border-0 bg-transparent p-0 pb-1 shadow-none',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2',
                  'text-xs font-medium shadow-none',
                  'data-[state=active]:border-primary data-[state=active]:bg-primary',
                  'data-[state=active]:text-primary-foreground',
                  'data-[state=inactive]:border-border data-[state=inactive]:bg-card',
                  'data-[state=inactive]:text-muted-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="appearance" className="mt-3 focus-visible:outline-none sm:mt-4">
          <SettingsPanel
            title="Theme"
            description="Choose how AI Interview Trainer looks on your device."
          >
            <ThemeSettings />
          </SettingsPanel>
        </TabsContent>

        <TabsContent value="voice" className="mt-3 focus-visible:outline-none sm:mt-4">
          <SettingsPanel
            title="Voice"
            description="Configure microphone access, speech language, and spoken responses."
          >
            <VoiceSettings />
          </SettingsPanel>
        </TabsContent>

        <TabsContent value="notifications" className="mt-3 focus-visible:outline-none sm:mt-4">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="privacy" className="mt-3 focus-visible:outline-none sm:mt-4">
          <ProfileDataSettings />
        </TabsContent>
      </Tabs>
    </section>
  )
}
