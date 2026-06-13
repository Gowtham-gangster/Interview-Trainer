'use client'

import type { UserProfile } from '@/types/profile'

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  emailNotifications: boolean
  pushNotifications: boolean
  interviewReminders: boolean
  productUpdates: boolean
  browserNotifications: boolean
  soundAlerts: boolean
  language: string
}

export interface UserAppData {
  profile: UserProfile
  settings: AppSettings
  onboardingCompleted?: boolean
  updatedAt: string
  pendingEmail?: string | null
  emailManagedByGoogle?: boolean
  emailChangeSent?: boolean
}

const STORAGE_PREFIX = 'ai-interview-trainer'

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

export const defaultSettings: AppSettings = {
  theme: 'system',
  emailNotifications: true,
  pushNotifications: false,
  interviewReminders: true,
  productUpdates: false,
  browserNotifications: false,
  soundAlerts: true,
  language: 'en',
}

function defaultProfileForUser(name: string, email: string): UserProfile {
  return {
    name,
    email,
    avatar: '',
    experienceLevel: 'intermediate',
    skills: ['Communication', 'Problem Solving', 'Teamwork'],
    targetRole: 'Software Engineer',
  }
}

export function createDefaultUserData(
  name: string,
  email: string
): UserAppData {
  return {
    profile: defaultProfileForUser(name, email),
    settings: { ...defaultSettings },
    updatedAt: new Date().toISOString(),
  }
}

function normalizeUserData(raw: Record<string, unknown>): UserAppData | null {
  if (!raw.profile || !raw.settings) return null

  return {
    profile: raw.profile as UserProfile,
    settings: raw.settings as AppSettings,
    updatedAt:
      typeof raw.updatedAt === 'string'
        ? raw.updatedAt
        : new Date().toISOString(),
  }
}

export function loadUserData(userId: string): UserAppData | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    return normalizeUserData(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    return null
  }
}

export function saveUserData(userId: string, data: UserAppData) {
  if (typeof window === 'undefined') return

  localStorage.setItem(
    storageKey(userId),
    JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
  )
}

export function getOrCreateUserData(
  userId: string,
  name: string,
  email: string
): UserAppData {
  const existing = loadUserData(userId)
  if (existing) return existing

  const created = createDefaultUserData(name, email)
  saveUserData(userId, created)
  return created
}
