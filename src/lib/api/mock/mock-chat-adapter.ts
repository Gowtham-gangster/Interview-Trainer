import type { StreamChatOptions } from '@/lib/api/chat-service'
import type {
  CreateMessageRequest,
  CreateThreadRequest,
  ListMessagesParams,
  SendChatMessageRequest,
  SendChatMessageResponse,
  StreamChatChunk,
  WatsonxMessage,
  WatsonxThread,
} from '@/lib/api/types/watsonx'
import {
  MOCK_MESSAGES,
  MOCK_THREADS,
  delay,
  mockId,
  nextMessageId,
  nextThreadId,
} from '@/lib/api/mock/watsonx-mock-data'

const threads = [...MOCK_THREADS]
const messagesByThread: Record<string, WatsonxMessage[]> = {
  ...MOCK_MESSAGES,
}

function ensureThreadMessages(threadId: string): WatsonxMessage[] {
  if (!messagesByThread[threadId]) {
    messagesByThread[threadId] = []
  }
  return messagesByThread[threadId]
}

const MOCK_ASSISTANT_REPLIES = [
  "That's a solid answer. Can you walk me through your approach to optimizing time complexity in that solution?",
  'Good point. How would you handle edge cases when the input is empty or null?',
  'Interesting perspective. What trade-offs did you consider between scalability and simplicity?',
]

export const mockChatAdapter = {
  async createThread(payload: CreateThreadRequest = {}): Promise<WatsonxThread> {
    await delay(300)
    const thread: WatsonxThread = {
      id: nextThreadId(),
      title: payload.title ?? 'New Interview Session',
      status: 'active',
      assistant_id: payload.assistant_id ?? 'assistant_interview',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: payload.metadata,
    }
    threads.unshift(thread)
    ensureThreadMessages(thread.id)
    return thread
  },

  async listThreads(params?: {
    limit?: number
    offset?: number
  }): Promise<WatsonxThread[]> {
    await delay(250)
    const offset = params?.offset ?? 0
    const limit = params?.limit ?? 20
    return threads.slice(offset, offset + limit)
  },

  async getThread(threadId: string): Promise<WatsonxThread> {
    await delay(200)
    const thread = threads.find((t) => t.id === threadId)
    if (!thread) throw new Error(`Thread not found: ${threadId}`)
    return thread
  },

  async updateThread(
    threadId: string,
    payload: Partial<CreateThreadRequest>
  ): Promise<WatsonxThread> {
    await delay(200)
    const index = threads.findIndex((t) => t.id === threadId)
    if (index === -1) throw new Error(`Thread not found: ${threadId}`)
    threads[index] = {
      ...threads[index],
      ...payload,
      updated_at: new Date().toISOString(),
    }
    return threads[index]
  },

  async deleteThread(threadId: string): Promise<void> {
    await delay(200)
    const index = threads.findIndex((t) => t.id === threadId)
    if (index !== -1) threads.splice(index, 1)
    delete messagesByThread[threadId]
  },

  async listMessages(
    threadId: string,
    _params?: ListMessagesParams
  ): Promise<WatsonxMessage[]> {
    await delay(200)
    return [...ensureThreadMessages(threadId)]
  },

  async createMessage(
    threadId: string,
    payload: CreateMessageRequest
  ): Promise<WatsonxMessage> {
    await delay(200)
    const message: WatsonxMessage = {
      id: nextMessageId(),
      thread_id: threadId,
      role: payload.role,
      content: payload.content,
      created_at: new Date().toISOString(),
      metadata: payload.metadata,
    }
    ensureThreadMessages(threadId).push(message)
    return message
  },

  async sendMessage(
    payload: SendChatMessageRequest
  ): Promise<SendChatMessageResponse> {
    await delay(600)

    let threadId = payload.thread_id
    if (!threadId) {
      const thread = await mockChatAdapter.createThread({
        title: 'Interview Session',
        assistant_id: payload.assistant_id,
        metadata: payload.metadata,
      })
      threadId = thread.id
    }

    const userMessage: WatsonxMessage = {
      id: nextMessageId(),
      thread_id: threadId,
      role: 'user',
      content: payload.message,
      created_at: new Date().toISOString(),
    }
    ensureThreadMessages(threadId).push(userMessage)

    const reply =
      MOCK_ASSISTANT_REPLIES[
        Math.floor(Math.random() * MOCK_ASSISTANT_REPLIES.length)
      ]
    const assistantMessage: WatsonxMessage = {
      id: nextMessageId(),
      thread_id: threadId,
      role: 'assistant',
      content: reply,
      created_at: new Date().toISOString(),
    }
    ensureThreadMessages(threadId).push(assistantMessage)

    return {
      thread_id: threadId,
      message: assistantMessage,
      run_id: mockId('run'),
    }
  },

  async streamMessage(
    payload: SendChatMessageRequest,
    options: StreamChatOptions
  ): Promise<void> {
    const { onChunk, onComplete, onError } = options

    try {
      let threadId = payload.thread_id
      if (!threadId) {
        const thread = await mockChatAdapter.createThread({
          title: 'Interview Session',
          assistant_id: payload.assistant_id,
        })
        threadId = thread.id
        onChunk({ type: 'delta', thread_id: threadId })
      }

      const userMessage: WatsonxMessage = {
        id: nextMessageId(),
        thread_id: threadId,
        role: 'user',
        content: payload.message,
        created_at: new Date().toISOString(),
      }
      ensureThreadMessages(threadId).push(userMessage)

      const fullReply =
        MOCK_ASSISTANT_REPLIES[
          Math.floor(Math.random() * MOCK_ASSISTANT_REPLIES.length)
        ]
      const words = fullReply.split(' ')

      for (const word of words) {
        await delay(40)
        if (options.signal?.aborted) return
        onChunk({
          type: 'delta',
          content: `${word} `,
          thread_id: threadId,
        })
      }

      const assistantMessage: WatsonxMessage = {
        id: nextMessageId(),
        thread_id: threadId,
        role: 'assistant',
        content: fullReply,
        created_at: new Date().toISOString(),
      }
      ensureThreadMessages(threadId).push(assistantMessage)

      onChunk({
        type: 'done',
        thread_id: threadId,
        message_id: assistantMessage.id,
      })
      onComplete?.()
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  },

  async regenerateMessage(messageId: string): Promise<SendChatMessageResponse> {
    await delay(500)
    const threadId = Object.keys(messagesByThread).find((id) =>
      messagesByThread[id].some((m) => m.id === messageId)
    )
    if (!threadId) throw new Error(`Message not found: ${messageId}`)

    const assistantMessage: WatsonxMessage = {
      id: nextMessageId(),
      thread_id: threadId,
      role: 'assistant',
      content:
        'Let me rephrase my feedback — your answer shows good structure. Consider adding a concrete metric to strengthen impact.',
      created_at: new Date().toISOString(),
    }
    ensureThreadMessages(threadId).push(assistantMessage)

    return {
      thread_id: threadId,
      message: assistantMessage,
      run_id: mockId('run'),
    }
  },
}
