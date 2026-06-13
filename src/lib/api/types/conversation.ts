import type { WatsonxMessage, WatsonxThread } from '@/lib/api/types/watsonx'

export type ConversationType =
  | 'technical'
  | 'behavioral'
  | 'mixed'
  | 'hr'
  | 'soft-skills'
  | 'mock'

export interface Conversation extends WatsonxThread {
  type?: ConversationType
  message_count?: number
  last_message_preview?: string
  last_message_at?: string
}

export interface ConversationWithMessages {
  conversation: Conversation
  messages: WatsonxMessage[]
}

export interface StartConversationRequest {
  title?: string
  type?: ConversationType
  assistant_id?: string
  metadata?: Record<string, unknown>
}

export interface SendConversationMessageRequest {
  conversation_id: string
  message: string
  stream?: boolean
  metadata?: Record<string, unknown>
}
