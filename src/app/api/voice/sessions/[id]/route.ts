import { NextResponse } from 'next/server'

import { getVoiceSession } from '@/lib/server/voice-session-store'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getVoiceSession(id)

  if (!session) {
    return NextResponse.json({ message: 'Voice session not found' }, { status: 404 })
  }

  return NextResponse.json(session)
}
