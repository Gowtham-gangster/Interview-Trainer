import type {
  StartVoiceSessionRequest,
  VoiceSession,
  VoiceSynthesizeRequest,
  VoiceSynthesizeResponse,
  VoiceTranscribeRequest,
  VoiceTranscribeResponse,
} from '@/lib/api/types/voice-api'
import {
  MOCK_VOICE_SESSIONS,
  delay,
  mockId,
  nextVoiceSessionId,
} from '@/lib/api/mock/watsonx-mock-data'

const sessions = [...MOCK_VOICE_SESSIONS]

const MOCK_TRANSCRIPTS = [
  'I led a cross-functional team to deliver a microservices migration that reduced deployment time by sixty percent.',
  'In my previous role, I designed a caching layer that improved API response times from eight hundred milliseconds to under two hundred.',
  'When faced with a production outage, I coordinated incident response and implemented monitoring that prevented recurrence.',
]

export const mockVoiceAdapter = {
  async startSession(
    payload: StartVoiceSessionRequest = {}
  ): Promise<VoiceSession> {
    await delay(200)
    const session: VoiceSession = {
      id: nextVoiceSessionId(),
      thread_id: payload.thread_id,
      status: 'idle',
      created_at: new Date().toISOString(),
    }
    sessions.unshift(session)
    return session
  },

  async getSession(sessionId: string): Promise<VoiceSession> {
    await delay(150)
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) throw new Error(`Voice session not found: ${sessionId}`)
    return session
  },

  async transcribe(
    payload: VoiceTranscribeRequest
  ): Promise<VoiceTranscribeResponse> {
    await delay(700)
    const transcript =
      MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)]

    if (payload.thread_id) {
      const session = sessions.find((s) => s.thread_id === payload.thread_id)
      if (session) {
        session.status = 'ready'
        session.last_transcript = transcript
        session.updated_at = new Date().toISOString()
      }
    }

    return {
      transcript,
      confidence: 0.92,
      duration_seconds: Math.max(3, Math.round(payload.audio.size / 4000)),
      language: payload.language ?? 'en',
      message_id: mockId('voice_msg'),
    }
  },

  async synthesize(
    payload: VoiceSynthesizeRequest
  ): Promise<VoiceSynthesizeResponse> {
    await delay(500)
    return {
      audio_base64: undefined,
      audio_url: undefined,
      duration_seconds: Math.max(2, Math.round(payload.text.length / 15)),
      content_type: 'audio/wav',
    }
  },
}
