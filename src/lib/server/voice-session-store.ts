import type { VoiceSession } from '@/lib/api/types/voice-api'
import { prisma } from '@/lib/db/prisma'

function toVoiceSession(record: {
  id: string
  orchestrateThreadId: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  lastTranscript: string | null
}): VoiceSession {
  return {
    id: record.id,
    thread_id: record.orchestrateThreadId ?? undefined,
    status: record.status as VoiceSession['status'],
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString(),
    last_transcript: record.lastTranscript ?? undefined,
  }
}

export async function createVoiceSession(input: {
  thread_id?: string
  language?: string
  user_id?: string
  interview_session_id?: string
}): Promise<VoiceSession> {
  const record = await prisma.voiceSession.create({
    data: {
      id: `voice_${crypto.randomUUID()}`,
      orchestrateThreadId: input.thread_id,
      language: input.language ?? 'en',
      userId: input.user_id,
      interviewSessionId: input.interview_session_id,
      status: 'ready',
    },
  })

  return toVoiceSession(record)
}

export async function getVoiceSession(
  sessionId: string
): Promise<VoiceSession | undefined> {
  const record = await prisma.voiceSession.findUnique({
    where: { id: sessionId },
  })

  return record ? toVoiceSession(record) : undefined
}

export async function updateVoiceSession(
  sessionId: string,
  update: Partial<Pick<VoiceSession, 'status' | 'last_transcript' | 'thread_id'>>
): Promise<VoiceSession | undefined> {
  try {
    const record = await prisma.voiceSession.update({
      where: { id: sessionId },
      data: {
        status: update.status,
        lastTranscript: update.last_transcript,
        orchestrateThreadId: update.thread_id,
      },
    })
    return toVoiceSession(record)
  } catch {
    return undefined
  }
}
