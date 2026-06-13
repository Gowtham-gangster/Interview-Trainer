import type { ChatSessionSummary } from '@/lib/store/chat-store'
import type { Message } from '@/types'

interface SessionListItem extends Omit<ChatSessionSummary, 'updatedAt'> {
  updatedAt: string
  orchestrateThreadId?: string
}

export async function fetchChatSessions(): Promise<{
  sessions: ChatSessionSummary[]
  orchestrateThreadIds: Record<string, string>
}> {
  const response = await fetch('/api/chat/sessions', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to load chat sessions')
  }

  const items = (await response.json()) as SessionListItem[]
  const orchestrateThreadIds: Record<string, string> = {}

  const sessions = items.map((item) => {
    if (item.orchestrateThreadId) {
      orchestrateThreadIds[item.id] = item.orchestrateThreadId
    }

    return {
      id: item.id,
      title: item.title,
      preview: item.preview,
      updatedAt: new Date(item.updatedAt),
      messageCount: item.messageCount,
    }
  })

  return { sessions, orchestrateThreadIds }
}

export async function fetchChatSession(sessionId: string): Promise<{
  messages: Message[]
  orchestrateThreadId?: string
}> {
  const response = await fetch(`/api/chat/sessions/${sessionId}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to load chat session')
  }

  const data = (await response.json()) as {
    messages: Array<Omit<Message, 'timestamp'> & { timestamp: string }>
    session: { orchestrateThreadId?: string }
  }

  return {
    messages: data.messages.map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    })),
    orchestrateThreadId: data.session.orchestrateThreadId,
  }
}

export async function createChatSessionOnServer(input: {
  id: string
  title?: string
  type?: string
  welcomeMessage?: Message
}): Promise<void> {
  await fetch('/api/chat/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: input.id,
      title: input.title,
      type: input.type,
      ...(input.welcomeMessage
        ? {
            welcomeMessage: {
              ...input.welcomeMessage,
              timestamp: input.welcomeMessage.timestamp.toISOString(),
            },
          }
        : {}),
    }),
  })
}

export async function saveChatSessionOnServer(input: {
  id: string
  title: string
  type?: string
  orchestrateThreadId?: string
  messages: Message[]
}): Promise<void> {
  await fetch(`/api/chat/sessions/${input.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      type: input.type,
      orchestrateThreadId: input.orchestrateThreadId,
      messages: input.messages.map((message) => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      })),
    }),
  })
}

export async function deleteAllChatSessionsOnServer(): Promise<number> {
  const response = await fetch('/api/chat/sessions', { method: 'DELETE' })

  if (!response.ok) {
    let message = `Failed to delete chats (${response.status})`
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const body = (await response.json()) as { deletedCount?: number }
  return body.deletedCount ?? 0
}

export async function deleteChatSessionOnServer(sessionId: string): Promise<void> {
  const response = await fetch(`/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    let message = `Failed to delete chat (${response.status})`
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
}
