import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { ensureChatShareToken } from '@/lib/db/chat-repository'
import { enforceRateLimit } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const rateLimited = await enforceRateLimit(request, 'apiProxy', user.id)
    if (rateLimited) return rateLimited

    const { id } = await context.params
    const shareToken = await ensureChatShareToken(user.id, id)

    if (!shareToken) {
      return NextResponse.json(
        { message: 'Chat not found or has no messages to share' },
        { status: 404 }
      )
    }

    return NextResponse.json({ shareToken })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create share link'
    return NextResponse.json({ message }, { status: 500 })
  }
}
