import { apiService, ApiService } from './api-service'
import { isWatsonxMockMode } from './config/watsonx-config'
import { mockChatAdapter } from './mock/mock-chat-adapter'
import { getApiBaseUrl } from './api-base-url'
import { WATSONX_ENDPOINTS, buildQueryString } from './watsonx-endpoints'
import { ApiServiceError } from './errors'
import { LOADING_KEYS, useApiLoadingStore } from '@/lib/store/api-loading-store'
import type {
  WatsonxThread,
  WatsonxMessage,
  CreateThreadRequest,
  CreateMessageRequest,
  SendChatMessageRequest,
  ListMessagesParams,
  StreamChatChunk,
} from './types/watsonx'

export interface StreamChatOptions {
  onChunk: (chunk: StreamChatChunk) => void
  onComplete?: () => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}

/**
 * Chat service — IBM watsonx Orchestrate message threads & chat completions.
 * Calls the backend BFF which proxies to watsonx Orchestrate APIs.
 */
export class ChatService {
  constructor(private readonly api: ApiService = apiService) {}

  // ─── Threads ───────────────────────────────────────────────────────────────

  async createThread(
    payload: CreateThreadRequest = {}
  ): Promise<WatsonxThread> {
    if (isWatsonxMockMode()) return mockChatAdapter.createThread(payload)
    return this.api.post<WatsonxThread>(
      WATSONX_ENDPOINTS.THREADS.CREATE,
      payload,
      { loadingKey: LOADING_KEYS.THREAD_CREATE }
    )
  }

  async listThreads(params?: {
    limit?: number
    offset?: number
    status?: string
  }): Promise<WatsonxThread[]> {
    if (isWatsonxMockMode()) return mockChatAdapter.listThreads(params)
    const qs = buildQueryString(params)
    return this.api.get<WatsonxThread[]>(
      `${WATSONX_ENDPOINTS.THREADS.LIST}${qs}`,
      { loadingKey: LOADING_KEYS.THREAD_LIST }
    )
  }

  async getThread(threadId: string): Promise<WatsonxThread> {
    if (isWatsonxMockMode()) return mockChatAdapter.getThread(threadId)
    return this.api.get<WatsonxThread>(
      WATSONX_ENDPOINTS.THREADS.GET(threadId)
    )
  }

  async updateThread(
    threadId: string,
    payload: Partial<CreateThreadRequest>
  ): Promise<WatsonxThread> {
    if (isWatsonxMockMode()) return mockChatAdapter.updateThread(threadId, payload)
    return this.api.patch<WatsonxThread>(
      WATSONX_ENDPOINTS.THREADS.UPDATE(threadId),
      payload
    )
  }

  async deleteThread(threadId: string): Promise<void> {
    if (isWatsonxMockMode()) return mockChatAdapter.deleteThread(threadId)
    await this.api.delete<void>(
      WATSONX_ENDPOINTS.THREADS.DELETE(threadId)
    )
  }

  // ─── Messages ──────────────────────────────────────────────────────────────

  async listMessages(
    threadId: string,
    params?: ListMessagesParams
  ): Promise<WatsonxMessage[]> {
    if (isWatsonxMockMode()) return mockChatAdapter.listMessages(threadId, params)
    const qs = buildQueryString(params)
    return this.api.get<WatsonxMessage[]>(
      `${WATSONX_ENDPOINTS.MESSAGES.LIST(threadId)}${qs}`,
      { loadingKey: LOADING_KEYS.MESSAGE_LIST }
    )
  }

  async createMessage(
    threadId: string,
    payload: CreateMessageRequest
  ): Promise<WatsonxMessage> {
    if (isWatsonxMockMode()) return mockChatAdapter.createMessage(threadId, payload)
    return this.api.post<WatsonxMessage>(
      WATSONX_ENDPOINTS.MESSAGES.CREATE(threadId),
      payload,
      { loadingKey: LOADING_KEYS.CHAT_SEND }
    )
  }

  async getMessage(
    threadId: string,
    messageId: string
  ): Promise<WatsonxMessage> {
    return this.api.get<WatsonxMessage>(
      WATSONX_ENDPOINTS.MESSAGES.GET(threadId, messageId)
    )
  }

  async deleteMessage(threadId: string, messageId: string): Promise<void> {
    await this.api.delete<void>(
      WATSONX_ENDPOINTS.MESSAGES.DELETE(threadId, messageId)
    )
  }

  // ─── High-level Chat ───────────────────────────────────────────────────────

  /**
   * Stream chat response via SSE from BFF.
   * Uses native fetch for ReadableStream support.
   */
  async streamMessage(
    payload: SendChatMessageRequest,
    options: StreamChatOptions
  ): Promise<void> {
    const { onChunk, onComplete, onError, signal } = options
    const key = LOADING_KEYS.CHAT_STREAM
    useApiLoadingStore.getState().startLoading(key)

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('auth_token')
          : null

      const response = await fetch(`${getApiBaseUrl()}/chat/stream`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: payload.message,
          thread_id: payload.thread_id,
          session_id: payload.session_id,
          metadata: payload.metadata,
          stream: true,
        }),
        signal,
      })

      if (!response.ok) {
        let errorBody: { message?: string; error?: string } = {}
        try {
          errorBody = await response.json()
        } catch {
          /* ignore */
        }
        throw new ApiServiceError(
          errorBody.message || errorBody.error || `Stream failed (${response.status})`,
          response.status
        )
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Response body is not readable')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6)
            if (data === '[DONE]') {
              onComplete?.()
              return
            }
            try {
              const parsed = JSON.parse(data) as StreamChatChunk
              onChunk(parsed)
              if (parsed.type === 'done') {
                onComplete?.()
                return
              }
              if (parsed.type === 'error') {
                throw new ApiServiceError(
                  parsed.error || 'Stream error',
                  500
                )
              }
            } catch (parseError) {
              if (parseError instanceof ApiServiceError) throw parseError
              onChunk({ type: 'delta', content: data })
            }
          }
        }
      }

      onComplete?.()
    } catch (error) {
      const apiError =
        error instanceof ApiServiceError
          ? error
          : error instanceof Error
            ? error
            : new Error(String(error))
      onError?.(apiError)
      throw apiError
    } finally {
      useApiLoadingStore.getState().stopLoading(key)
    }
  }
}

export const chatService = new ChatService()
