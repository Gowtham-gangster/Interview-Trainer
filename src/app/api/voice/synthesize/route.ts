import { NextResponse } from 'next/server'

import type { VoiceSynthesizeResponse } from '@/lib/api/types/voice-api'
import {
  MAX_TTS_TEXT_LENGTH,
  requireApiUser,
  validateMessageLength,
} from '@/lib/server/api-auth'
import { enforceRateLimit } from '@/lib/server/rate-limit'
import { synthesizeSpeechWithWatson } from '@/lib/server/watson-speech'

export async function POST(request: Request) {
  const { user, error } = await requireApiUser()
  if (error) return error

  const rateLimited = await enforceRateLimit(request, 'voice', user.id)
  if (rateLimited) return rateLimited

  try {
    const body = (await request.json()) as {
      text?: string
      language?: string
      voice_id?: string
    }

    const text = body.text?.trim() ?? ''
    if (!text) {
      return NextResponse.json({ message: 'Text is required.' }, { status: 400 })
    }

    const lengthError = validateMessageLength(text, MAX_TTS_TEXT_LENGTH)
    if (lengthError) return lengthError

    const result = await synthesizeSpeechWithWatson({
      text,
      voice: body.voice_id,
    })

    const response: VoiceSynthesizeResponse = {
      audio_base64: result.audioBase64,
      content_type: result.contentType,
      duration_seconds: Math.max(1, Math.ceil(text.length / 14)),
    }

    return NextResponse.json(response)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Speech synthesis failed'

    return NextResponse.json(
      {
        message,
        fallback: 'browser',
      },
      { status: 500 }
    )
  }
}
