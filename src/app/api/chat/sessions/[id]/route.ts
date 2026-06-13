import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import {
  deleteChatSession,
  getChatSession,
  upsertChatSessionState,
} from '@/lib/db/chat-repository'
import type { Message } from '@/types'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const result = await getChatSession(user.id, id)

    if (!result) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({
      session: {
        ...result.session,
        orchestrateThreadId: result.orchestrateThreadId,
        startedAt: result.session.startedAt.toISOString(),
        endedAt: result.session.endedAt?.toISOString(),
        createdAt: result.session.createdAt.toISOString(),
        updatedAt: result.session.updatedAt.toISOString(),
      },
      messages: result.messages.map((message) => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      })),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load chat session'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = (await request.json()) as {
      title: string
      preview?: string
      type?: string
      orchestrateThreadId?: string
      messages: Message[]
    }

    await upsertChatSessionState(user.id, {
      id,
      title: body.title,
      preview: body.preview ?? '',
      type: body.type,
      orchestrateThreadId: body.orchestrateThreadId,
      messages: body.messages.map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      })),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save chat session'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const deleted = await deleteChatSession(user.id, id)

    if (!deleted) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete chat session'
    return NextResponse.json({ message }, { status: 500 })
  }
}
