'use client'

export interface VoiceConfig {
  enabled: boolean
  language: string
  autoSend: boolean
  speakResponses: boolean
  speechRate: number
  preferredVoice: string | null
  microphoneDeviceId: string | null
}

export const VOICE_LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-IN', label: 'English (India)' },
  { value: 'hi-IN', label: 'Hindi (India)' },
  { value: 'ta-IN', label: 'Tamil (India)' },
  { value: 'te-IN', label: 'Telugu (India)' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'es-ES', label: 'Spanish' },
] as const

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  enabled: true,
  language: 'en-IN',
  autoSend: true,
  speakResponses: false,
  speechRate: 1,
  preferredVoice: null,
  microphoneDeviceId: null,
}

const LEGACY_STORAGE_KEY = 'ai-interview-trainer-voice-config'
const VOICE_CONFIG_VERSION = 5

export function normalizeLanguageCode(language: string): string {
  const trimmed = language.trim()
  if (!trimmed) return DEFAULT_VOICE_CONFIG.language

  const [primary, region] = trimmed.split('-')
  if (!region) return trimmed.toLowerCase()

  return `${primary.toLowerCase()}-${region.toUpperCase()}`
}

type StoredVoiceConfig = Partial<VoiceConfig> & {
  version?: number
}

function storageKeyForUser(userId?: string | null) {
  if (userId) return `ai-interview-trainer-voice-config:${userId}`
  return LEGACY_STORAGE_KEY
}

function normalizeVoiceConfig(raw: StoredVoiceConfig): VoiceConfig {
  const version = raw.version ?? 1
  const speakResponses =
    version >= 5
      ? raw.speakResponses === true
      : version >= 4
        ? raw.speakResponses !== false
        : raw.speakResponses === true

  return {
    ...DEFAULT_VOICE_CONFIG,
    ...raw,
    language: normalizeLanguageCode(raw.language ?? DEFAULT_VOICE_CONFIG.language),
    autoSend: version >= 4 ? raw.autoSend !== false : raw.autoSend === true,
    speakResponses,
    microphoneDeviceId: raw.microphoneDeviceId ?? null,
  }
}

function loadFromStorage(
  raw: string | null,
  userId?: string | null
): VoiceConfig {
  if (!raw) return { ...DEFAULT_VOICE_CONFIG }

  const parsed = JSON.parse(raw) as StoredVoiceConfig
  const config = normalizeVoiceConfig(parsed)

  if ((parsed.version ?? 1) < VOICE_CONFIG_VERSION) {
    const migrated = normalizeVoiceConfig({
      ...config,
      version: VOICE_CONFIG_VERSION,
      autoSend: config.autoSend ?? true,
      speakResponses: false,
    })
    saveVoiceConfig(migrated, userId)
    return migrated
  }

  return config
}

export function loadVoiceConfig(userId?: string | null): VoiceConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_VOICE_CONFIG }

  try {
    const scopedKey = storageKeyForUser(userId)
    const scopedRaw = localStorage.getItem(scopedKey)
    if (scopedRaw) {
      return loadFromStorage(scopedRaw, userId)
    }

    if (userId) return { ...DEFAULT_VOICE_CONFIG }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    return loadFromStorage(legacyRaw, userId)
  } catch {
    return { ...DEFAULT_VOICE_CONFIG }
  }
}

export function saveVoiceConfig(config: VoiceConfig, userId?: string | null) {
  if (typeof window === 'undefined') return

  const payload: StoredVoiceConfig = {
    ...config,
    version: VOICE_CONFIG_VERSION,
  }

  localStorage.setItem(storageKeyForUser(userId), JSON.stringify(payload))
}
