import type { Message } from '@/types'

export interface SharedChatPayload {
  sessionId: string
  title: string
  type: string
  sharedBy: { id: string; name: string }
  sharedAt: string | null
  isOwner: boolean
  messages: Message[]
}

function buildShareUrl(shareToken: string): string {
  if (typeof window === 'undefined') {
    return `/chat/share/${shareToken}`
  }
  return `${window.location.origin}/chat/share/${shareToken}`
}

export async function createChatShareLink(sessionId: string): Promise<string> {
  const response = await fetch(`/api/chat/sessions/${sessionId}/share`, {
    method: 'POST',
  })

  if (!response.ok) {
    let message = 'Failed to create share link'
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const body = (await response.json()) as { shareToken: string }
  return buildShareUrl(body.shareToken)
}

export async function fetchSharedChat(
  shareToken: string
): Promise<SharedChatPayload> {
  const response = await fetch(`/api/chat/share/${shareToken}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    let message = 'Failed to load shared chat'
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const data = (await response.json()) as Omit<SharedChatPayload, 'messages'> & {
    messages: Array<Omit<Message, 'timestamp'> & { timestamp: string }>
  }

  return {
    ...data,
    messages: data.messages.map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    })),
  }
}

export async function importSharedChat(
  shareToken: string
): Promise<{ sessionId: string; title: string; messageCount: number }> {
  const response = await fetch(`/api/chat/share/${shareToken}/import`, {
    method: 'POST',
  })

  if (!response.ok) {
    let message = 'Failed to import shared chat'
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  return (await response.json()) as {
    sessionId: string
    title: string
    messageCount: number
  }
}
