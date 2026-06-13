/**
 * IBM watsonx Orchestrate API routes exposed by the backend BFF.
 * Frontend calls NEXT_PUBLIC_API_BASE_URL + these paths.
 * Backend proxies to watsonx Orchestrate /v1/* endpoints.
 */
export const WATSONX_ENDPOINTS = {
  HEALTH: '/health',
  VERSION: '/version',

  THREADS: {
    CREATE: '/v1/threads',
    LIST: '/v1/threads',
    GET: (threadId: string) => `/v1/threads/${threadId}`,
    UPDATE: (threadId: string) => `/v1/threads/${threadId}`,
    DELETE: (threadId: string) => `/v1/threads/${threadId}`,
  },

  MESSAGES: {
    LIST: (threadId: string) => `/v1/threads/${threadId}/messages`,
    CREATE: (threadId: string) => `/v1/threads/${threadId}/messages`,
    GET: (threadId: string, messageId: string) =>
      `/v1/threads/${threadId}/messages/${messageId}`,
    DELETE: (threadId: string, messageId: string) =>
      `/v1/threads/${threadId}/messages/${messageId}`,
  },

  CHAT: {
    SEND: '/v1/chat/completions',
    STREAM: '/v1/chat/stream',
    REGENERATE: (messageId: string) => `/v1/chat/messages/${messageId}/regenerate`,
  },

  ASSISTANTS: {
    LIST: '/v1/assistants',
    GET: (assistantId: string) => `/v1/assistants/${assistantId}`,
  },

  CONVERSATIONS: {
    LIST: '/v1/conversations',
    GET: (conversationId: string) => `/v1/conversations/${conversationId}`,
    CREATE: '/v1/conversations',
    UPDATE: (conversationId: string) => `/v1/conversations/${conversationId}`,
    DELETE: (conversationId: string) => `/v1/conversations/${conversationId}`,
    MESSAGES: (conversationId: string) =>
      `/v1/conversations/${conversationId}/messages`,
  },

  RESUME: {
    UPLOAD: '/resume/upload',
    LIST: '/resume',
    GET: (resumeId: string) => `/resume/${resumeId}`,
    DELETE: (resumeId: string) => `/resume/${resumeId}`,
    STATUS: (resumeId: string) => `/resume/${resumeId}/status`,
    ANALYZE: (resumeId: string) => `/resume/${resumeId}/analyze`,
  },

  VOICE: {
    TRANSCRIBE: '/voice/transcribe',
    SYNTHESIZE: '/voice/synthesize',
    SESSIONS: '/voice/sessions',
    SESSION: (sessionId: string) => `/voice/sessions/${sessionId}`,
  },
} as const

export function buildQueryString(
  params?: Record<string, string | number | boolean | undefined | null> | object
): string {
  if (!params) return ''

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}
