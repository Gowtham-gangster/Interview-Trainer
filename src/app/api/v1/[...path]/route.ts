import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requireApiUser } from '@/lib/server/api-auth'
import { enforceRateLimit } from '@/lib/server/rate-limit'
import { proxyToWatsonx } from '@/lib/server/watsonx-proxy'
import { isWatsonxServerConfigured } from '@/lib/server/watsonx-env'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ path: string[] }>
}

async function handleProxy(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  const { user, error } = await requireApiUser()
  if (error) return error

  const rateLimited = await enforceRateLimit(request, 'apiProxy', user.id)
  if (rateLimited) return rateLimited

  if (!isWatsonxServerConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message:
          'watsonx Orchestrate is not configured. Set WATSONX_API_KEY and WATSONX_INSTANCE_URL in .env.local.',
      },
      { status: 503 }
    )
  }

  const { path } = await context.params
  const pathSegments = ['v1', ...path]

  try {
    return await proxyToWatsonx(request, pathSegments)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to proxy watsonx request'

    return NextResponse.json(
      { success: false, message },
      { status: 502 }
    )
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context)
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context)
}
