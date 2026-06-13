'use client'

import { useQuery } from '@tanstack/react-query'

import { isWatsonxMockMode, watsonxConfig } from '@/lib/api/config/watsonx-config'
import type { WatsonxHealthResponse } from '@/lib/api/types/watsonx'

export const watsonxHealthKeys = {
  all: ['watsonx', 'health'] as const,
}

async function fetchHealth(): Promise<WatsonxHealthResponse> {
  if (isWatsonxMockMode()) {
    return {
      status: 'ok',
      version: 'mock',
      orchestrate: {
        connected: true,
        latency_ms: 12,
      },
    }
  }

  const response = await fetch('/api/health', { cache: 'no-store' })
  const data = (await response.json()) as WatsonxHealthResponse

  if (!response.ok && data.status !== 'degraded') {
    return {
      status: 'down',
      reason: data.reason ?? `Health check failed (${response.status})`,
      orchestrate: { connected: false, ...data.orchestrate },
    }
  }

  return data
}

export function useWatsonxHealth() {
  return useQuery({
    queryKey: watsonxHealthKeys.all,
    queryFn: fetchHealth,
    staleTime: 60_000,
    retry: isWatsonxMockMode() ? 0 : 2,
  })
}

export function useWatsonxConfig() {
  return {
    ...watsonxConfig,
    isMockMode: isWatsonxMockMode(),
  }
}
