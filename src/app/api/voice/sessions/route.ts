import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { createVoiceSession } from '@/lib/server/voice-session-store'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    thread_id?: string
    language?: string
    interview_session_id?: string
  }

  const user = await getAuthUser()

  const session = await createVoiceSession({
    thread_id: body.thread_id,
    language: body.language,
    user_id: user?.id,
    interview_session_id: body.interview_session_id,
  })

  return NextResponse.json(session)
}
