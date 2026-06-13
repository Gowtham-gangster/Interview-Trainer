import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import {
  createChatSession,
  deleteAllChatSessions,
  listChatSessions,
} from '@/lib/db/chat-repository'
import type { Message } from '@/types'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await listChatSessions(user.id)
    return NextResponse.json(
      sessions.map((session) => ({
        ...session,
        updatedAt: session.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load chat sessions'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      id: string
      title?: string
      type?: string
      welcomeMessage?: Message
    }

    if (!body.id) {
      return NextResponse.json(
        { message: 'Session id is required' },
        { status: 400 }
      )
    }

    const session = await createChatSession(user.id, {
      id: body.id,
      title: body.title,
      type: body.type,
      ...(body.welcomeMessage
        ? {
            welcomeMessage: {
              ...body.welcomeMessage,
              timestamp: new Date(body.welcomeMessage.timestamp),
            },
          }
        : {}),
    })

    return NextResponse.json({
      ...session,
      updatedAt: session.updatedAt.toISOString(),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create chat session'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const deletedCount = await deleteAllChatSessions(user.id)

    return NextResponse.json({ success: true, deletedCount })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete chat history'
    return NextResponse.json({ message }, { status: 500 })
  }
}
