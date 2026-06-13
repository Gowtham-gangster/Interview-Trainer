'use client'

import { useState } from 'react'
import {
  Bell,
  Mic,
  Monitor,
  User,
} from 'lucide-react'

import { PageHeader } from '@/components/common/page-header'
import { AccountSettings } from '@/components/settings/account-settings'
import { NotificationSettings } from '@/components/settings/notification-settings'
import { SettingsPanel } from '@/components/settings/settings-panel'
import { ThemeSettings } from '@/components/settings/theme-settings'
import { VoiceSettings } from '@/components/settings/voice-settings'
import { cn } from '@/lib/utils'

type SettingsSection =
  | 'appearance'
  | 'voice'
  | 'notifications'
  | 'account'

const navItems: {
  id: SettingsSection
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Theme and display',
    icon: Monitor,
  },
  {
    id: 'voice',
    label: 'Voice',
    description: 'Microphone and speech',
    icon: Mic,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Email and alerts',
    icon: Bell,
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Security and data',
    icon: User,
  },
]

export function SettingsPageContent() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance')

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Manage your workspace preferences, notifications, and account."
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <nav className="lg:w-64 lg:shrink-0">
          <div className="mb-1 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="hidden rounded-xl border border-border/60 bg-card p-2 shadow-sm lg:block">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p
                      className={cn(
                        'truncate text-xs',
                        isActive
                          ? 'text-primary-foreground/80'
                          : 'text-muted-foreground',
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          {activeSection === 'appearance' && (
            <SettingsPanel
              title="Theme"
              description="Choose how AI Interview Trainer looks on your device."
            >
              <ThemeSettings />
            </SettingsPanel>
          )}

          {activeSection === 'voice' && (
            <SettingsPanel
              title="Voice"
              description="Configure microphone access, speech language, and spoken responses."
            >
              <VoiceSettings />
            </SettingsPanel>
          )}

          {activeSection === 'notifications' && <NotificationSettings />}
          {activeSection === 'account' && <AccountSettings />}
        </div>
      </div>
    </div>
  )
}
