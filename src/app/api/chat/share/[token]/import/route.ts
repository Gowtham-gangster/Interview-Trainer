import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { importSharedChat } from '@/lib/db/chat-repository'
import { enforceRateLimit } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ token: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const rateLimited = await enforceRateLimit(request, 'apiProxy', user.id)
    if (rateLimited) return rateLimited

    const { token } = await context.params
    const imported = await importSharedChat(user.id, token)

    if (!imported) {
      return NextResponse.json(
        { message: 'Shared chat not found or is empty' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      sessionId: imported.sessionId,
      title: imported.title,
      messageCount: imported.messageCount,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to import shared chat'
    return NextResponse.json({ message }, { status: 500 })
  }
}
