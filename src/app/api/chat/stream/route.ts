import { NextResponse } from 'next/server'

import {
  requireApiUser,
  validateMessageLength,
} from '@/lib/server/api-auth'
import { enforceRateLimit } from '@/lib/server/rate-limit'
import { runOrchestrateChat } from '@/lib/server/orchestrate-client'
import { isWatsonxServerConfigured } from '@/lib/server/watsonx-env'
import { isValidUuid } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 300

interface ChatStreamRequest {
  message?: string
  thread_id?: string
  session_id?: string
  metadata?: { session_type?: string; type?: string }
}

function encodeSse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: Request) {
  const { user, error } = await requireApiUser()
  if (error) return error

  const rateLimited = await enforceRateLimit(request, 'chat', user.id)
  if (rateLimited) return rateLimited

  const body = (await request.json()) as ChatStreamRequest
  const message = body.message?.trim()

  if (!message) {
    return NextResponse.json(
      { success: false, message: 'Message is required' },
      { status: 400 }
    )
  }

  const lengthError = validateMessageLength(message)
  if (lengthError) return lengthError

  const sessionType =
    body.metadata?.session_type ?? body.metadata?.type ?? 'mixed'
  const threadId = body.thread_id

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const push = (payload: unknown) => {
        controller.enqueue(encoder.encode(encodeSse(payload)))
      }

      try {
        let content = ''
        let resolvedThreadId = isValidUuid(threadId) ? threadId : undefined
        let source: 'orchestrate' | 'error' = 'orchestrate'

        if (!isWatsonxServerConfigured()) {
          push({
            type: 'error',
            error:
              'IBM watsonx Orchestrate is not configured. Set WATSONX_API_KEY and WATSONX_INSTANCE_URL in .env.local.',
          })
          controller.close()
          return
        }

        try {
          const result = await runOrchestrateChat({
            message,
            sessionType,
            threadId: resolvedThreadId,
            onDelta: (delta, meta) => {
              if (meta?.threadId && isValidUuid(meta.threadId)) {
                resolvedThreadId = meta.threadId
              }
              if (!delta) {
                if (resolvedThreadId) {
                  push({
                    type: 'thread',
                    thread_id: resolvedThreadId,
                    source: 'orchestrate',
                  })
                }
                return
              }
              content += delta
              push({
                type: 'delta',
                content: delta,
                thread_id: resolvedThreadId,
                source: 'orchestrate',
              })
            },
            signal: request.signal,
          })

          content = result.content
          if (result.threadId && isValidUuid(result.threadId)) {
            resolvedThreadId = result.threadId
          }
        } catch (orchestrateError) {
          console.error('[chat/stream] Orchestrate failed:', orchestrateError)
          source = 'error'
          const detail =
            orchestrateError instanceof Error
              ? orchestrateError.message
              : 'Orchestrate request failed'
          push({
            type: 'error',
            error: `Interview Trainer Agent unavailable: ${detail}`,
          })
          controller.close()
          return
        }

        push({
          type: 'done',
          thread_id: resolvedThreadId,
          content,
          source,
        })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        push({
          type: 'error',
          error: error instanceof Error ? error.message : 'Chat stream failed',
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
