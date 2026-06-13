/**
 * IBM watsonx Orchestrate API types (frontend contract).
 * Backend BFF proxies these to watsonx Orchestrate REST APIs.
 * @see https://developer.watson-orchestrate.ibm.com/apis/message-threads
 */

export type WatsonxMessageRole = 'user' | 'assistant' | 'system'

export type WatsonxThreadStatus = 'active' | 'archived' | 'closed'

export interface WatsonxThread {
  id: string
  title?: string
  status?: WatsonxThreadStatus
  assistant_id?: string
  created_at?: string
  updated_at?: string
  metadata?: Record<string, unknown>
}

export interface WatsonxMessage {
  id: string
  thread_id: string
  role: WatsonxMessageRole
  content: string
  created_at?: string
  updated_at?: string
  metadata?: Record<string, unknown>
}

export interface CreateThreadRequest {
  title?: string
  assistant_id?: string
  metadata?: Record<string, unknown>
}

export interface CreateMessageRequest {
  role: WatsonxMessageRole
  content: string
  metadata?: Record<string, unknown>
}

export interface SendChatMessageRequest {
  thread_id?: string
  message: string
  session_id?: string
  assistant_id?: string
  stream?: boolean
  metadata?: Record<string, unknown>
}

export interface SendChatMessageResponse {
  thread_id: string
  message: WatsonxMessage
  run_id?: string
}

export interface ListMessagesParams {
  limit?: number
  offset?: number
  order?: 'asc' | 'desc'
}

export interface StreamChatChunk {
  type: 'message' | 'delta' | 'done' | 'error' | 'thread'
  content?: string
  message_id?: string
  thread_id?: string
  error?: string
  source?: 'orchestrate' | 'fallback' | 'error'
}

export interface WatsonxHealthResponse {
  status: 'ok' | 'degraded' | 'down'
  version?: string
  /** Safe diagnostic hint when status is down (no secrets) */
  reason?: string
  rate_limit?: {
    backend: 'redis' | 'memory' | 'disabled'
  }
  orchestrate?: {
    connected: boolean
    latency_ms?: number
    agent_id?: string
    agent_name?: string
    environment_id?: string
    environment_name?: string
  }
}

export interface ApiEnvelope<T> {
  data: T
  message?: string
  success: boolean
}
