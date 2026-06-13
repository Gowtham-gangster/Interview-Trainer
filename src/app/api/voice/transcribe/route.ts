import { NextResponse } from 'next/server'

import type { VoiceTranscribeResponse } from '@/lib/api/types/voice-api'
import { requireApiUser } from '@/lib/server/api-auth'
import { enforceRateLimit } from '@/lib/server/rate-limit'
import { updateVoiceSession } from '@/lib/server/voice-session-store'
import { transcribeAudioWithWatson } from '@/lib/server/watson-speech'

export async function POST(request: Request) {
  const { user, error } = await requireApiUser()
  if (error) return error

  const rateLimited = await enforceRateLimit(request, 'voice', user.id)
  if (rateLimited) return rateLimited

  try {
    const formData = await request.formData()
    const transcriptField = formData.get('transcript')
    const language = String(formData.get('language') ?? 'en-IN')
    const sessionId = formData.get('session_id')
    const audio = formData.get('audio')
    const durationSeconds =
      Number(formData.get('duration_seconds') ?? 0) || undefined

    const browserTranscript =
      typeof transcriptField === 'string' ? transcriptField.trim() : ''

    if (!audio || !(audio instanceof Blob) || audio.size < 100) {
      return NextResponse.json(
        { message: 'A valid audio recording is required.' },
        { status: 400 }
      )
    }

    const audioBuffer = await audio.arrayBuffer()
    let transcript = browserTranscript
    let confidence: number | undefined

    try {
      const watsonResult = await transcribeAudioWithWatson({
        audio: audioBuffer,
        mimeType: audio.type || 'audio/wav',
        language,
      })

      if (watsonResult.transcript) {
        transcript = watsonResult.transcript
        confidence = watsonResult.confidence
      } else if (!browserTranscript) {
        throw new Error('Watson STT did not detect any speech in the recording.')
      }
    } catch (watsonError) {
      if (browserTranscript) {
        transcript = browserTranscript
      } else {
        throw watsonError
      }
    }

    const response: VoiceTranscribeResponse = {
      transcript,
      confidence,
      duration_seconds: durationSeconds || 1,
      language,
      message_id: `voice_msg_${crypto.randomUUID()}`,
    }

    if (typeof sessionId === 'string') {
      await updateVoiceSession(sessionId, {
        last_transcript: response.transcript,
        status: 'ready',
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Speech transcription failed'

    return NextResponse.json({ message }, { status: 500 })
  }
}
