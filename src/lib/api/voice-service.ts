import { apiService, ApiService } from '@/lib/api/api-service'
import { isWatsonxMockMode } from '@/lib/api/config/watsonx-config'
import { mockVoiceAdapter } from '@/lib/api/mock/mock-voice-adapter'
import { WATSONX_ENDPOINTS } from '@/lib/api/watsonx-endpoints'
import type {
  StartVoiceSessionRequest,
  VoiceSession,
  VoiceSynthesizeRequest,
  VoiceSynthesizeResponse,
  VoiceTranscribeRequest,
  VoiceTranscribeResponse,
} from '@/lib/api/types/voice-api'
import { LOADING_KEYS } from '@/lib/store/api-loading-store'

export class VoiceService {
  constructor(private readonly api: ApiService = apiService) {}

  async startSession(
    payload: StartVoiceSessionRequest = {}
  ): Promise<VoiceSession> {
    if (isWatsonxMockMode()) {
      return mockVoiceAdapter.startSession(payload)
    }

    return this.api.post<VoiceSession>(
      WATSONX_ENDPOINTS.VOICE.SESSIONS,
      payload,
      { loadingKey: LOADING_KEYS.VOICE_SESSION }
    )
  }

  async getSession(sessionId: string): Promise<VoiceSession> {
    if (isWatsonxMockMode()) {
      return mockVoiceAdapter.getSession(sessionId)
    }

    return this.api.get<VoiceSession>(
      WATSONX_ENDPOINTS.VOICE.SESSION(sessionId)
    )
  }

  async transcribe(
    payload: VoiceTranscribeRequest
  ): Promise<VoiceTranscribeResponse> {
    if (isWatsonxMockMode()) {
      return mockVoiceAdapter.transcribe(payload)
    }

    const formData = new FormData()
    formData.append(
      'audio',
      payload.audio,
      `recording.${payload.mime_type?.split('/')[1] ?? 'webm'}`
    )
    if (payload.thread_id) formData.append('thread_id', payload.thread_id)
    if (payload.session_id) formData.append('session_id', payload.session_id)
    if (payload.language) formData.append('language', payload.language)
    if (payload.transcript) formData.append('transcript', payload.transcript)
    if (payload.duration_seconds) {
      formData.append('duration_seconds', String(payload.duration_seconds))
    }

    return this.api.upload<VoiceTranscribeResponse>(
      WATSONX_ENDPOINTS.VOICE.TRANSCRIBE,
      formData,
      { loadingKey: LOADING_KEYS.VOICE_TRANSCRIBE, timeout: 60_000 }
    )
  }

  async synthesize(
    payload: VoiceSynthesizeRequest
  ): Promise<VoiceSynthesizeResponse> {
    if (isWatsonxMockMode()) {
      return mockVoiceAdapter.synthesize(payload)
    }

    return this.api.post<VoiceSynthesizeResponse>(
      WATSONX_ENDPOINTS.VOICE.SYNTHESIZE,
      payload,
      { loadingKey: LOADING_KEYS.VOICE_SYNTHESIZE, timeout: 60_000 }
    )
  }
}

export const voiceService = new VoiceService()
