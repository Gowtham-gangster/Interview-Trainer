import type { NextRequest } from 'next/server'

import { getIamAccessToken } from './watsonx-iam'
import { getWatsonxInstanceUrl } from './watsonx-env'

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
])

function buildTargetUrl(pathSegments: string[], request: NextRequest): string {
  const baseUrl = getWatsonxInstanceUrl()
  const path = pathSegments.join('/')
  const target = new URL(`${baseUrl}/${path}`)

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value)
  })

  return target.toString()
}

function buildForwardHeaders(
  request: NextRequest,
  accessToken: string
): Headers {
  const headers = new Headers()

  headers.set('Authorization', `Bearer ${accessToken}`)
  headers.set('Accept', request.headers.get('accept') ?? 'application/json')

  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers.set('Content-Type', contentType)
  }

  return headers
}

function buildResponseHeaders(upstream: Response): Headers {
  const headers = new Headers()

  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  return headers
}

export async function proxyToWatsonx(
  request: NextRequest,
  pathSegments: string[]
): Promise<Response> {
  const accessToken = await getIamAccessToken()
  const targetUrl = buildTargetUrl(pathSegments, request)
  const method = request.method.toUpperCase()

  const init: RequestInit = {
    method,
    headers: buildForwardHeaders(request, accessToken),
    redirect: 'manual',
  }

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  const upstream = await fetch(targetUrl, init)

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: buildResponseHeaders(upstream),
  })
}
