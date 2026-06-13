import type { AppSettings, UserAppData } from '@/lib/data/app-storage'
import type { OnboardingProfileInput } from '@/lib/db/user-data-repository'
import type { UserProfile } from '@/types/profile'

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}

export async function fetchUserAppData(): Promise<UserAppData> {
  return parseResponse<UserAppData>(await fetch('/api/users/data'))
}

export async function updateUserAppProfile(
  profile: UserProfile,
  currentPassword?: string
): Promise<UserAppData> {
  return parseResponse<UserAppData>(
    await fetch('/api/users/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, currentPassword }),
    })
  )
}

export async function updateUserAppSettings(
  settings: AppSettings
): Promise<UserAppData> {
  return parseResponse<UserAppData>(
    await fetch('/api/users/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    })
  )
}

export async function completeUserOnboarding(
  profile: OnboardingProfileInput
): Promise<UserAppData> {
  return parseResponse<UserAppData>(
    await fetch('/api/users/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
  )
}

export async function resetUserAppData(): Promise<UserAppData> {
  return parseResponse<UserAppData>(
    await fetch('/api/users/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true }),
    })
  )
}
