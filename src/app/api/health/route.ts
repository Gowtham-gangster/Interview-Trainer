import { NextResponse } from 'next/server'

import { getRateLimitBackend } from '@/lib/server/rate-limit'
import { isWatsonxServerConfigured } from '@/lib/server/watsonx-env'
import type { WatsonxHealthResponse } from '@/lib/api/types/watsonx'

export const runtime = 'nodejs'

function sanitizeHealthError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error'

  if (message.includes('Missing required environment variable')) {
    return 'Missing WATSONX_API_KEY on server'
  }
  if (message.includes('WATSONX_INSTANCE_URL')) {
    return 'Missing WATSONX_INSTANCE_URL on server'
  }
  if (message.includes('Failed to obtain IBM IAM token')) {
    return 'Invalid WATSONX_API_KEY or IBM IAM rejected the key'
  }
  if (message.includes('Failed to list agents')) {
    return 'IBM Orchestrate rejected the API request — check instance URL and key'
  }
  if (message.includes('WATSONX_AGENT_ID not found')) {
    return 'WATSONX_AGENT_ID does not match any agent in your IBM instance'
  }
  if (message.includes('No agent environment')) {
    return 'No agent environment found — check WATSONX_AGENT_ENVIRONMENT_NAME (draft vs live)'
  }

  return message.slice(0, 200)
}

export async function GET(): Promise<NextResponse<WatsonxHealthResponse>> {
  if (!isWatsonxServerConfigured()) {
    return NextResponse.json(
      {
        status: 'down',
        reason:
          'Set WATSONX_API_KEY and WATSONX_INSTANCE_URL in Vercel environment variables, then redeploy',
        orchestrate: { connected: false },
      },
      { status: 503 }
    )
  }

  const startedAt = Date.now()

  try {
    const { resolveAgentConfig } = await import('@/lib/server/orchestrate-client')
    const agentConfig = await resolveAgentConfig('mixed')

    const latencyMs = Date.now() - startedAt
    const connected = Boolean(agentConfig.agentId)

    const payload: WatsonxHealthResponse = {
      status: connected ? 'ok' : 'degraded',
      version: 'bff-1.0',
      rate_limit: {
        backend: getRateLimitBackend(),
      },
      orchestrate: {
        connected,
        latency_ms: latencyMs,
        agent_id: agentConfig.agentId,
        agent_name: agentConfig.agentName,
        environment_id: agentConfig.environmentId,
        environment_name: agentConfig.environmentName,
      },
    }

    return NextResponse.json(payload, {
      status: connected ? 200 : 503,
    })
  } catch (error) {
    console.error('[health] Orchestrate check failed:', error)

    return NextResponse.json(
      {
        status: 'down',
        version: 'bff-1.0',
        reason: sanitizeHealthError(error),
        orchestrate: {
          connected: false,
          latency_ms: Date.now() - startedAt,
        },
      },
      { status: 503 }
    )
  }
}
