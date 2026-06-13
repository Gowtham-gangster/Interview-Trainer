import { randomUUID } from 'crypto'

import type { Message, InterviewSession } from '@/types'
import { prisma } from '@/lib/db/prisma'

export interface ChatSessionSummaryRecord {
  id: string
  title: string
  preview: string
  updatedAt: Date
  messageCount: number
  orchestrateThreadId?: string
}

function toMessage(record: {
  id: string
  sessionId: string
  role: string
  content: string
  createdAt: Date
  questionType: string | null
  difficulty: string | null
  tags: string[]
  feedback: string | null
  score: number | null
}): Message {
  return {
    id: record.id,
    sessionId: record.sessionId,
    role: record.role as Message['role'],
    content: record.content,
    timestamp: record.createdAt,
    metadata:
      record.questionType ||
      record.difficulty ||
      record.tags.length ||
      record.feedback ||
      record.score != null
        ? {
            questionType: record.questionType as Message['metadata'] extends infer M
              ? M extends { questionType?: infer Q }
                ? Q
                : never
              : never,
            difficulty: record.difficulty as Message['metadata'] extends infer M
              ? M extends { difficulty?: infer D }
                ? D
                : never
              : never,
            tags: record.tags,
            feedback: record.feedback ?? undefined,
            score: record.score ?? undefined,
          }
        : undefined,
  }
}

function getSessionPreview(messages: Message[]): string {
  const lastUser = [...messages].reverse().find((message) => message.role === 'user')
  if (lastUser) return lastUser.content.slice(0, 60)
  return 'Start a new conversation...'
}

export async function listChatSessions(
  userId: string
): Promise<ChatSessionSummaryRecord[]> {
  const sessions = await prisma.interviewSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  })

  return sessions.map((session: (typeof sessions)[number]) => ({
    id: session.id,
    title: session.title,
    preview: session.messages[0]?.content.slice(0, 60) ?? 'Start a new conversation...',
    updatedAt: session.updatedAt,
    messageCount: session._count.messages,
    orchestrateThreadId: session.orchestrateThreadId ?? undefined,
  }))
}

export async function getChatSession(
  userId: string,
  sessionId: string
): Promise<{
  session: InterviewSession
  messages: Message[]
  orchestrateThreadId?: string
} | null> {
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!session) return null

  const messages = session.messages.map(toMessage)

  return {
    session: {
      id: session.id,
      userId: session.userId,
      title: session.title,
      jobRole: session.jobRole,
      company: session.company ?? undefined,
      difficulty: session.difficulty as InterviewSession['difficulty'],
      type: session.type as InterviewSession['type'],
      status: session.status as InterviewSession['status'],
      duration: session.durationMinutes,
      startedAt: session.startedAt,
      endedAt: session.endedAt ?? undefined,
      messages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    messages,
    orchestrateThreadId: session.orchestrateThreadId ?? undefined,
  }
}

export async function createChatSession(
  userId: string,
  input: {
    id: string
    title?: string
    type?: string
    welcomeMessage?: Message
  }
): Promise<ChatSessionSummaryRecord> {
  await prisma.interviewSession.create({
    data: {
      id: input.id,
      userId,
      title: input.title ?? 'New Interview',
      type: input.type ?? 'mixed',
      ...(input.welcomeMessage
        ? {
            messages: {
              create: {
                id: input.welcomeMessage.id,
                role: input.welcomeMessage.role,
                content: input.welcomeMessage.content,
                createdAt: input.welcomeMessage.timestamp,
              },
            },
          }
        : {}),
    },
  })

  return {
    id: input.id,
    title: input.title ?? 'New Interview',
    preview: input.welcomeMessage
      ? getSessionPreview([input.welcomeMessage])
      : 'Start a new conversation...',
    updatedAt: new Date(),
    messageCount: input.welcomeMessage ? 1 : 0,
  }
}

function toMessageWriteData(message: Message, sessionId: string) {
  return {
    id: message.id,
    sessionId,
    role: message.role,
    content: message.content,
    createdAt: message.timestamp,
    questionType: message.metadata?.questionType,
    difficulty: message.metadata?.difficulty,
    tags: message.metadata?.tags ?? [],
    feedback: message.metadata?.feedback,
    score: message.metadata?.score,
  }
}

/** Nested `messages.create` must not include `sessionId` — Prisma sets it via the relation. */
function toNestedMessageCreateData(message: Message) {
  const { sessionId: _sessionId, ...data } = toMessageWriteData(
    message,
    message.sessionId
  )
  return data
}

export async function upsertChatSessionState(
  userId: string,
  input: {
    id: string
    title: string
    preview: string
    type?: string
    orchestrateThreadId?: string
    messages: Message[]
  }
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.interviewSession.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        userId,
        title: input.title,
        type: input.type ?? 'mixed',
        orchestrateThreadId: input.orchestrateThreadId,
      },
      update: {
        title: input.title,
        orchestrateThreadId: input.orchestrateThreadId,
        updatedAt: new Date(),
      },
    })

    if (input.messages.length === 0) {
      await tx.message.deleteMany({ where: { sessionId: input.id } })
      return
    }

    const existing = await tx.message.findMany({
      where: { sessionId: input.id },
      select: { id: true },
    })
    const incomingIds = new Set(input.messages.map((message) => message.id))
    const staleIds = existing
      .map((message) => message.id)
      .filter((id) => !incomingIds.has(id))

    if (staleIds.length > 0) {
      await tx.message.deleteMany({ where: { id: { in: staleIds } } })
    }

    await Promise.all(
      input.messages.map((message) => {
        const data = toMessageWriteData(message, input.id)
        return tx.message.upsert({
          where: { id: message.id },
          create: data,
          update: {
            content: data.content,
            role: data.role,
            createdAt: data.createdAt,
            questionType: data.questionType,
            difficulty: data.difficulty,
            tags: data.tags,
            feedback: data.feedback,
            score: data.score,
          },
        })
      })
    )
  })
}

export async function deleteAllChatSessions(userId: string): Promise<number> {
  const result = await prisma.interviewSession.deleteMany({
    where: { userId },
  })
  return result.count
}

function createShareToken(): string {
  return randomUUID().replace(/-/g, '')
}

function createImportedSessionId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12)
}

function createImportedMessageId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 16)
}

export async function ensureChatShareToken(
  userId: string,
  sessionId: string
): Promise<string | null> {
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    select: {
      id: true,
      shareToken: true,
      _count: { select: { messages: true } },
    },
  })

  if (!session || session._count.messages === 0) {
    return null
  }

  if (session.shareToken) {
    return session.shareToken
  }

  const shareToken = createShareToken()
  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      shareToken,
      sharedAt: new Date(),
    },
  })

  return shareToken
}

export async function getSharedChatByToken(token: string): Promise<{
  sessionId: string
  title: string
  type: string
  sharedBy: { id: string; name: string }
  sharedAt: Date | null
  messages: Message[]
} | null> {
  const session = await prisma.interviewSession.findFirst({
    where: { shareToken: token },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      user: { select: { id: true, name: true } },
    },
  })

  if (!session) return null

  return {
    sessionId: session.id,
    title: session.title,
    type: session.type,
    sharedBy: {
      id: session.user.id,
      name: session.user.name ?? 'User',
    },
    sharedAt: session.sharedAt,
    messages: session.messages.map(toMessage),
  }
}

export async function importSharedChat(
  userId: string,
  token: string
): Promise<{ sessionId: string; title: string; messageCount: number } | null> {
  const shared = await getSharedChatByToken(token)
  if (!shared || shared.messages.length === 0) return null

  const newSessionId = createImportedSessionId()
  const importedTitle = shared.title.endsWith(' (shared)')
    ? shared.title
    : `${shared.title} (shared)`

  await prisma.$transaction(async (tx) => {
    await tx.interviewSession.create({
      data: {
        id: newSessionId,
        userId,
        title: importedTitle,
        type: shared.type,
        messages: {
          create: shared.messages.map((message) =>
            toNestedMessageCreateData({
              ...message,
              id: createImportedMessageId(),
              sessionId: newSessionId,
            })
          ),
        },
      },
    })
  })

  return {
    sessionId: newSessionId,
    title: importedTitle,
    messageCount: shared.messages.length,
  }
}

export async function deleteChatSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const owned = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  })

  if (!owned) {
    return false
  }

  // Messages and feedback cascade; resumes/voice sessions unlink (onDelete: SetNull).
  await prisma.interviewSession.delete({ where: { id: sessionId } })

  return true
}
