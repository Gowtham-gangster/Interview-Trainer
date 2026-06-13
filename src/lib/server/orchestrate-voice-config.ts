import { orchestrateFetch } from './orchestrate-voice-fetch'
import { resolveAgentConfig } from './orchestrate-client'

export interface WatsonSttSettings {
  apiUrl: string
  model: string
}

export interface WatsonTtsSettings {
  apiUrl: string
  voice: string
  language: string
}

export interface ResolvedVoiceSettings {
  name: string
  language: string
  speechToText: WatsonSttSettings
  textToSpeech: WatsonTtsSettings
}

interface VoiceConfigurationRecord {
  name?: string
  language?: string
  speech_to_text?: {
    provider?: string
    watson_stt_config?: {
      api_url?: string
      model?: string
    }
  }
  text_to_speech?: {
    provider?: string
    watson_tts_config?: {
      api_url?: string
      voice?: string
      language?: string
    }
  }
}

let cachedVoiceSettings: ResolvedVoiceSettings | null = null
let cacheExpiresAt = 0

function normalizeSttModel(model: string | undefined, language: string): string {
  const candidate = (model || language || 'en-US').trim()

  // Full Watson model IDs include an underscore, e.g. en-US_Multimedia
  if (candidate.includes('_')) return candidate

  const lang = candidate.toLowerCase()

  // IBM voice config often stores bare locale codes like "en-IN"
  if (/^[a-z]{2}-[a-z]{2}$/i.test(candidate)) return candidate

  if (lang.startsWith('en-in')) return 'en-IN'
  if (lang.startsWith('en-gb')) return 'en-GB_BroadbandModel'
  if (lang.startsWith('en')) return 'en-US_Multimedia'

  return candidate
}

export async function resolveOrchestrateVoiceSettings(): Promise<ResolvedVoiceSettings> {
  const now = Date.now()
  if (cachedVoiceSettings && now < cacheExpiresAt) {
    return cachedVoiceSettings
  }

  const envSttUrl = process.env.WATSON_STT_URL?.trim()
  const envTtsUrl = process.env.WATSON_TTS_URL?.trim()

  if (envSttUrl && envTtsUrl) {
    const language = process.env.WATSON_STT_LANGUAGE?.trim() || 'en-US'
    cachedVoiceSettings = {
      name: 'env',
      language,
      speechToText: {
        apiUrl: envSttUrl.replace(/\/$/, ''),
        model:
          process.env.WATSON_STT_MODEL?.trim() ||
          normalizeSttModel(undefined, language),
      },
      textToSpeech: {
        apiUrl: envTtsUrl.replace(/\/$/, ''),
        voice:
          process.env.WATSON_TTS_VOICE?.trim() || 'en-US_AllisonV3Voice',
        language: process.env.WATSON_TTS_LANGUAGE?.trim() || language,
      },
    }
    cacheExpiresAt = now + 5 * 60 * 1000
    return cachedVoiceSettings
  }

  const { agentId, environmentId } = await resolveAgentConfig()
  const query = new URLSearchParams({
    agent_id: agentId,
    environment_id: environmentId,
  })

  const response = await orchestrateFetch(
    `/v1/voice_configurations?${query.toString()}`
  )

  if (!response.ok) {
    throw new Error(
      `Failed to load watsonx voice configuration (${response.status})`
    )
  }

  const payload = (await response.json()) as {
    voice_configurations?: VoiceConfigurationRecord[]
  }

  const configuration = payload.voice_configurations?.[0]
  const stt = configuration?.speech_to_text?.watson_stt_config
  const tts = configuration?.text_to_speech?.watson_tts_config

  if (!stt?.api_url || !tts?.api_url) {
    throw new Error(
      'No Watson STT/TTS voice configuration is attached to the Interview Trainer agent.'
    )
  }

  const language =
    configuration?.language?.replace('_', '-') ||
    tts.language ||
    'en-US'

  cachedVoiceSettings = {
    name: configuration?.name ?? 'orchestrate',
    language,
    speechToText: {
      apiUrl: stt.api_url.replace(/\/$/, ''),
      model: normalizeSttModel(stt.model, language),
    },
    textToSpeech: {
      apiUrl: tts.api_url.replace(/\/$/, ''),
      voice: tts.voice || 'en-US_AllisonV3Voice',
      language: tts.language || language,
    },
  }

  cacheExpiresAt = now + 5 * 60 * 1000
  return cachedVoiceSettings
}

export function clearVoiceSettingsCache() {
  cachedVoiceSettings = null
  cacheExpiresAt = 0
}
