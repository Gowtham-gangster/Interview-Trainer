import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { getSharedChatByToken } from '@/lib/db/chat-repository'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ token: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await context.params
    const shared = await getSharedChatByToken(token)

    if (!shared) {
      return NextResponse.json({ message: 'Shared chat not found' }, { status: 404 })
    }

    return NextResponse.json({
      sessionId: shared.sessionId,
      title: shared.title,
      type: shared.type,
      sharedBy: shared.sharedBy,
      sharedAt: shared.sharedAt?.toISOString() ?? null,
      isOwner: shared.sharedBy.id === user.id,
      messages: shared.messages.map((message) => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      })),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load shared chat'
    return NextResponse.json({ message }, { status: 500 })
  }
}
