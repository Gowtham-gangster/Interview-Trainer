export type VoiceSessionStatus = 'idle' | 'recording' | 'processing' | 'ready' | 'error'

export interface VoiceTranscribeRequest {
  audio: Blob
  thread_id?: string
  session_id?: string
  language?: string
  mime_type?: string
  transcript?: string
  duration_seconds?: number
}

export interface VoiceTranscribeResponse {
  transcript: string
  confidence?: number
  duration_seconds: number
  language?: string
  message_id?: string
}

export interface VoiceSynthesizeRequest {
  text: string
  voice_id?: string
  language?: string
  thread_id?: string
}

export interface VoiceSynthesizeResponse {
  audio_url?: string
  audio_base64?: string
  duration_seconds?: number
  content_type?: string
}

export interface VoiceSession {
  id: string
  thread_id?: string
  status: VoiceSessionStatus
  created_at: string
  updated_at?: string
  last_transcript?: string
}

export interface StartVoiceSessionRequest {
  thread_id?: string
  session_id?: string
  language?: string
}
