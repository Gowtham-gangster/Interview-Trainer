'use client'

import { useApiLoadingStore, type LoadingKey } from '@/lib/store/api-loading-store'

/**
 * Subscribe to global API loading state.
 *
 * @param key - Optional specific loading key (e.g. 'chat:send').
 *              Omit to track any in-flight request.
 */
export function useApiLoading(key?: LoadingKey | string) {
  const pendingCount = useApiLoadingStore((s) => s.pendingCount)
  const isKeyLoading = useApiLoadingStore((s) =>
    key ? s.loadingKeys.has(key) : false
  )

  return {
    isLoading: key ? isKeyLoading : pendingCount > 0,
    pendingCount,
    isKeyLoading,
  }
}

export function useIsChatLoading() {
  const send = useApiLoadingStore((s) => s.loadingKeys.has('chat:send'))
  const stream = useApiLoadingStore((s) => s.loadingKeys.has('chat:stream'))
  const history = useApiLoadingStore((s) => s.loadingKeys.has('chat:history'))

  return {
    isSending: send,
    isStreaming: stream,
    isLoadingHistory: history,
    isLoading: send || stream || history,
  }
}
