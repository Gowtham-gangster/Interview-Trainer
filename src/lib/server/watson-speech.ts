import { buildWatsonSttModelCandidates } from '@/lib/voice/stt-language'

import { getIamAccessToken } from './watsonx-iam'
import {
  clearVoiceSettingsCache,
  resolveOrchestrateVoiceSettings,
} from './orchestrate-voice-config'

interface SpeechRecognitionResults {
  results?: Array<{
    alternatives?: Array<{
      transcript?: string
      confidence?: number
    }>
  }>
  error?: string
  code?: number
}

function sanitizeWatsonError(detail: string, status: number): string {
  if (detail.includes('<HTML') || detail.includes('<html')) {
    if (status === 503) {
      return 'IBM Watson Speech to Text is temporarily unavailable. Please try again in a moment.'
    }
    return `IBM Watson Speech to Text request failed (${status}).`
  }

  try {
    const parsed = JSON.parse(detail) as { error?: string; code_description?: string }
    if (parsed.error) {
      return parsed.code_description
        ? `${parsed.error} (${parsed.code_description})`
        : parsed.error
    }
  } catch {
    // Not JSON — use trimmed text below.
  }

  return detail.trim().slice(0, 280) || `Watson STT failed (${status})`
}

async function getSpeechBearerToken(): Promise<string> {
  const dedicatedKey =
    process.env.WATSON_STT_API_KEY?.trim() ||
    process.env.WATSON_SPEECH_API_KEY?.trim() ||
    process.env.WATSON_TTS_API_KEY?.trim()

  if (!dedicatedKey) {
    return getIamAccessToken()
  }

  const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: dedicatedKey,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `Failed to obtain speech service IAM token (${response.status}): ${detail}`
    )
  }

  const data = (await response.json()) as { access_token?: string }
  if (!data.access_token) {
    throw new Error('Speech service IAM token response did not include access_token')
  }

  return data.access_token
}

function normalizeMimeType(mimeType: string | undefined): string {
  if (!mimeType) return 'audio/webm'
  return mimeType.split(';')[0]?.trim() || 'audio/webm'
}

function extractTranscript(data: SpeechRecognitionResults): string {
  return (data.results ?? [])
    .flatMap((result) => result.alternatives ?? [])
    .map((alt) => alt.transcript?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
    .trim()
}

function buildContentTypeAttempts(
  audio: ArrayBuffer,
  mimeType: string
): Array<{ contentType: string; body: ArrayBuffer }> {
  const normalized = normalizeMimeType(mimeType)
  const attempts: Array<{ contentType: string; body: ArrayBuffer }> = [
    { contentType: normalized, body: audio },
  ]

  if (normalized === 'audio/wav' && audio.byteLength > 44) {
    attempts.push({
      contentType: 'audio/l16;rate=16000',
      body: audio.slice(44),
    })
  }

  return attempts
}

async function recognizeOnce(params: {
  apiUrl: string
  token: string
  model: string
  audio: ArrayBuffer
  contentType: string
}): Promise<{ transcript: string; confidence?: number } | null> {
  const { apiUrl, token, model, audio, contentType } = params
  const baseUrl = apiUrl.replace(/\/$/, '')
  const recognizeUrl = `${baseUrl}/v1/recognize?model=${encodeURIComponent(model)}&smart_formatting=true`

  const attempts: Array<() => Promise<Response>> = []

  for (const payload of buildContentTypeAttempts(audio, contentType)) {
    attempts.push(() =>
      fetch(recognizeUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': payload.contentType,
        },
        body: payload.body,
      })
    )

    attempts.push(() => {
      const formData = new FormData()
      formData.append(
        'metadata',
        JSON.stringify({
          part_content_type: payload.contentType,
        })
      )
      formData.append(
        'upload',
        new Blob([payload.body], { type: payload.contentType }),
        `recording.${payload.contentType.split('/')[1] ?? 'wav'}`
      )

      return fetch(recognizeUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
    })
  }

  let lastError = 'No transcript'

  for (const attempt of attempts) {
    const response = await attempt()
    const detail = await response.text()

    if (!response.ok) {
      lastError = sanitizeWatsonError(detail, response.status)

      if (response.status === 404) {
        throw new Error(lastError)
      }

      continue
    }

    const data = JSON.parse(detail) as SpeechRecognitionResults
    const transcript = extractTranscript(data)

    if (transcript) {
      return {
        transcript,
        confidence: data.results?.[0]?.alternatives?.[0]?.confidence,
      }
    }

    lastError = 'Watson STT did not detect any speech in the recording.'
  }

  throw new Error(lastError)
}

export async function transcribeAudioWithWatson(params: {
  audio: ArrayBuffer
  mimeType?: string
  language?: string
}): Promise<{ transcript: string; confidence?: number }> {
  if (params.audio.byteLength < 1000) {
    throw new Error(
      'Recording was too short. Speak for at least 2 seconds before stopping.'
    )
  }

  const settings = await resolveOrchestrateVoiceSettings()
  const token = await getSpeechBearerToken()
  const contentType = normalizeMimeType(params.mimeType)
  const models = buildWatsonSttModelCandidates(
    params.language ?? settings.language,
    settings.speechToText.model
  )

  let lastError: Error | null = null

  const contentTypes =
    contentType === 'audio/wav'
      ? ['audio/wav']
      : [contentType, 'audio/wav', 'audio/webm', 'audio/ogg']

  for (const model of models) {
    for (const attemptContentType of contentTypes) {
      try {
        const result = await recognizeOnce({
          apiUrl: settings.speechToText.apiUrl,
          token,
          model,
          audio: params.audio,
          contentType: attemptContentType,
        })

        if (result?.transcript) {
          return result
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (lastError.message.includes('not found')) {
          break
        }

        if (!lastError.message.includes('did not detect any speech')) {
          throw lastError
        }
      }
    }
  }

  throw (
    lastError ??
    new Error('Watson STT did not detect any speech in the recording.')
  )
}

export async function synthesizeSpeechWithWatson(params: {
  text: string
  voice?: string
}): Promise<{ audioBase64: string; contentType: string }> {
  const settings = await resolveOrchestrateVoiceSettings()
  const token = await getSpeechBearerToken()
  const voice = params.voice || settings.textToSpeech.voice
  const baseUrl = settings.textToSpeech.apiUrl.replace(/\/$/, '')

  const response = await fetch(
    `${baseUrl}/v1/synthesize?voice=${encodeURIComponent(voice)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'audio/ogg',
      },
      body: JSON.stringify({ text: params.text }),
    }
  )

  if (!response.ok) {
    const detail = await response.text()
    if (response.status === 403) {
      throw new Error(
        'IBM Watson Text to Speech rejected the request. Check WATSON_TTS_API_KEY in .env.local.'
      )
    }
    throw new Error(
      `Watson TTS failed (${response.status}): ${sanitizeWatsonError(detail, response.status)}`
    )
  }

  const buffer = await response.arrayBuffer()
  const audioBase64 = Buffer.from(buffer).toString('base64')

  return {
    audioBase64,
    contentType: response.headers.get('content-type') || 'audio/ogg',
  }
}

export async function getVoiceServiceStatus() {
  try {
    const settings = await resolveOrchestrateVoiceSettings()
    return {
      configured: true,
      provider: 'ibm_watson',
      voiceConfiguration: settings.name,
      speechToText: {
        model: settings.speechToText.model,
        language: settings.language,
      },
      textToSpeech: {
        voice: settings.textToSpeech.voice,
        language: settings.textToSpeech.language,
      },
      usesDedicatedSpeechApiKey: Boolean(
        process.env.WATSON_STT_API_KEY?.trim() ||
          process.env.WATSON_SPEECH_API_KEY?.trim() ||
          process.env.WATSON_TTS_API_KEY?.trim()
      ),
    }
  } catch (error) {
    return {
      configured: false,
      provider: 'ibm_watson',
      error: error instanceof Error ? error.message : 'Voice services unavailable',
      usesDedicatedSpeechApiKey: Boolean(
        process.env.WATSON_STT_API_KEY?.trim() ||
          process.env.WATSON_SPEECH_API_KEY?.trim() ||
          process.env.WATSON_TTS_API_KEY?.trim()
      ),
    }
  }
}

export { clearVoiceSettingsCache }
