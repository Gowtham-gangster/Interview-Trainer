import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Message, InterviewSession } from '@/types'
import { getErrorMessage } from '@/lib/api/errors'
import { chatService } from '@/lib/api/chat-service'
import {
  createChatSessionOnServer,
  deleteAllChatSessionsOnServer,
  deleteChatSessionOnServer,
  fetchChatSession,
  saveChatSessionOnServer,
} from '@/lib/api/chat-session-service'
import { resumeService } from '@/lib/api/resume-service'
import { formatResumeForAgent } from '@/lib/resume-chat-context'
import { generateId, isValidUuid } from '@/lib/utils'

export interface ChatSessionSummary {
  id: string
  title: string
  preview: string
  updatedAt: Date
  messageCount: number
}

interface ChatState {
  // Sessions
  sessions: ChatSessionSummary[]
  currentSession: InterviewSession | null
  setCurrentSession: (session: InterviewSession | null) => void
  createNewChat: () => void
  selectSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => Promise<void>
  deleteAllSessions: () => Promise<number>
  updateSessionTitle: (sessionId: string, title: string) => void
  renameSession: (sessionId: string, title: string) => Promise<void>
  hydrateSessions: (sessions: ChatSessionSummary[]) => void
  clearAllOrchestrateThreadIds: () => void
  persistCurrentSession: () => Promise<void>

  // Messages
  messages: Message[]
  sessionMessages: Record<string, Message[]>
  setMessages: (messages: Message[]) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, update: Partial<Message>) => void
  removeMessage: (id: string) => void
  clearMessages: () => void

  // Loading & streaming
  isLoading: boolean
  setLoading: (loading: boolean) => void
  isTyping: boolean
  setTyping: (typing: boolean) => void
  isStreaming: boolean
  setStreaming: (streaming: boolean) => void
  streamingMessageId: string | null
  setStreamingMessageId: (id: string | null) => void

  // Error
  error: string | null
  setError: (error: string | null) => void
  clearError: () => void

  // Input
  inputValue: string
  setInputValue: (value: string) => void

  // Resume
  uploadedResume: File | null
  setUploadedResume: (file: File | null) => void

  // Session context
  sessionType: string
  setSessionType: (type: string) => void
  userId: string | null
  setUserId: (userId: string | null) => void

  /** IBM Orchestrate thread UUIDs keyed by local session id */
  orchestrateThreadIds: Record<string, string>
  setOrchestrateThreadId: (sessionId: string, threadId: string) => void
  clearOrchestrateThreadId: (sessionId: string) => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  mobileDrawerOpen: boolean
  setMobileDrawerOpen: (open: boolean) => void

  // Voice reply (speak next assistant message after voice input)
  pendingVoiceReply: boolean
  setPendingVoiceReply: (pending: boolean) => void
  voiceChatActive: boolean
  setVoiceChatActive: (active: boolean) => void
  isSpeakingResponse: boolean
  setIsSpeakingResponse: (speaking: boolean) => void

  // Actions
  sendMessage: (content: string) => Promise<void>
  retryMessage: (messageId: string) => void
  clearSession: () => void
}

const SESSION_TYPE_MAP: Record<string, InterviewSession['type']> = {
  technical: 'technical',
  behavioral: 'behavioral',
  communication: 'behavioral',
  mixed: 'mixed',
}

function createDefaultSession(sessionType = 'mixed'): InterviewSession {
  const id = generateId(12)
  const now = new Date()
  return {
    id,
    userId: 'demo-user',
    title: 'New Interview',
    jobRole: 'Software Engineer',
    company: undefined,
    difficulty: 'intermediate',
    type: SESSION_TYPE_MAP[sessionType] ?? 'mixed',
    status: 'active',
    duration: 30,
    startedAt: now,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
}

function getSessionPreview(messages: Message[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (lastUser) return lastUser.content.slice(0, 60)
  return 'Start a new conversation...'
}

function deriveTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return 'New Interview'
  const text = firstUser.content.trim()
  return text.length > 40 ? `${text.slice(0, 40)}...` : text
}

function isPersistedSession(
  sessionId: string | undefined,
  sessions: ChatSessionSummary[]
): boolean {
  if (!sessionId) return false
  return sessions.some((session) => session.id === sessionId)
}

async function persistSessionState(get: () => ChatState) {
  const { currentSession, messages, orchestrateThreadIds, sessionType, userId, sessions } =
    get()

  if (!currentSession || !userId) return
  if (!isPersistedSession(currentSession.id, sessions)) return

  try {
    await saveChatSessionOnServer({
      id: currentSession.id,
      title: currentSession.title,
      type: sessionType,
      orchestrateThreadId: orchestrateThreadIds[currentSession.id],
      messages,
    })
  } catch {
    // Keep chat usable when the database is temporarily unavailable.
  }
}

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    sessions: [],
    currentSession: null,
    setCurrentSession: (session) => set({ currentSession: session }),

    createNewChat: () => {
      const { sessionType, userId } = get()
      const session = createDefaultSession(sessionType)
      if (userId) {
        session.userId = userId
      }

      set((state) => ({
        currentSession: session,
        messages: [],
        sessionMessages: {
          ...state.sessionMessages,
          [session.id]: [],
        },
        sessions: [
          {
            id: session.id,
            title: 'New Interview',
            preview: 'Start a new conversation...',
            updatedAt: new Date(),
            messageCount: 0,
          },
          ...state.sessions,
        ],
        inputValue: '',
        error: null,
        isLoading: false,
        isTyping: false,
        isStreaming: false,
        streamingMessageId: null,
        uploadedResume: null,
      }))

      if (userId) {
        void createChatSessionOnServer({
          id: session.id,
          title: 'New Interview',
          type: sessionType,
        })
      }
    },

    selectSession: (sessionId) => {
      const { sessions, sessionMessages, currentSession, sessionType, userId } =
        get()
      const summary = sessions.find((s) => s.id === sessionId)
      if (!summary) return

      if (currentSession?.id === sessionId) return

      if (currentSession && isPersistedSession(currentSession.id, sessions)) {
        void persistSessionState(get)
        set((state) => ({
          sessionMessages: {
            ...state.sessionMessages,
            [currentSession.id]: state.messages,
          },
        }))
      }

      const applySession = (messages: Message[]) => {
        // Never reuse IBM thread IDs from the database — they may belong to a
        // different environment (draft vs live) or carry stale conversation context.
        get().clearOrchestrateThreadId(sessionId)

        const session: InterviewSession = {
          id: sessionId,
          userId: userId ?? 'demo-user',
          title: summary.title,
          jobRole: 'Software Engineer',
          difficulty: 'intermediate',
          type: SESSION_TYPE_MAP[sessionType] ?? 'mixed',
          status: 'active',
          duration: 30,
          startedAt: summary.updatedAt,
          messages,
          createdAt: summary.updatedAt,
          updatedAt: summary.updatedAt,
        }

        set({
          currentSession: session,
          messages,
          sessionMessages: {
            ...get().sessionMessages,
            [sessionId]: messages,
          },
          inputValue: '',
          error: null,
          isLoading: false,
          isTyping: false,
          isStreaming: false,
          streamingMessageId: null,
        })
      }

      const stored = get().sessionMessages[sessionId]
      if (stored) {
        applySession(stored)
        return
      }

      if (userId) {
        void fetchChatSession(sessionId)
          .then(({ messages }) => {
            applySession(messages)
          })
          .catch(() => {
            applySession([])
          })
        return
      }

      applySession(get().sessionMessages[sessionId] ?? [])
    },

    deleteAllSessions: async () => {
      const { userId } = get()
      let deletedCount = 0

      if (userId) {
        deletedCount = await deleteAllChatSessionsOnServer()
      }

      set({
        sessions: [],
        sessionMessages: {},
        orchestrateThreadIds: {},
        messages: [],
        currentSession: null,
        error: null,
        isLoading: false,
        isTyping: false,
        isStreaming: false,
        streamingMessageId: null,
      })

      get().createNewChat()
      return deletedCount
    },

    deleteSession: async (sessionId) => {
      const { currentSession, sessions, userId } = get()

      if (userId) {
        await deleteChatSessionOnServer(sessionId)
      }

      const filtered = sessions.filter((s) => s.id !== sessionId)

      set((state) => {
        const { [sessionId]: _, ...restMessages } = state.sessionMessages
        const { [sessionId]: __, ...restThreads } = state.orchestrateThreadIds
        return {
          sessions: filtered,
          sessionMessages: restMessages,
          orchestrateThreadIds: restThreads,
        }
      })

      if (currentSession?.id === sessionId) {
        if (filtered.length > 0) {
          get().selectSession(filtered[0].id)
        } else {
          get().createNewChat()
        }
      }
    },

    updateSessionTitle: (sessionId, title) => {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, title } : s
        ),
        currentSession:
          state.currentSession?.id === sessionId
            ? { ...state.currentSession, title }
            : state.currentSession,
      }))
    },

    renameSession: async (sessionId, title) => {
      const trimmed = title.trim()
      if (!trimmed) return

      get().updateSessionTitle(sessionId, trimmed)

      const {
        userId,
        sessionMessages,
        messages,
        currentSession,
        orchestrateThreadIds,
        sessionType,
      } = get()

      if (!userId) return

      const messagesToSave =
        currentSession?.id === sessionId
          ? messages
          : sessionMessages[sessionId] ?? []

      try {
        await saveChatSessionOnServer({
          id: sessionId,
          title: trimmed,
          type: sessionType,
          orchestrateThreadId: orchestrateThreadIds[sessionId],
          messages: messagesToSave,
        })
      } catch {
        // Title is updated locally even if persistence fails.
      }
    },

    hydrateSessions: (sessions) => {
      if (sessions.length === 0) return
      set({ sessions })
    },

    clearAllOrchestrateThreadIds: () => {
      set({ orchestrateThreadIds: {} })
    },

    persistCurrentSession: async () => {
      await persistSessionState(get)
    },

    messages: [],
    sessionMessages: {},
    setMessages: (messages) => set({ messages }),

    addMessage: (message) => {
      const newMessage: Message = {
        id: generateId(),
        timestamp: new Date(),
        ...message,
      }
      set((state) => ({
        messages: [...state.messages, newMessage],
      }))
      return newMessage.id
    },

    updateMessage: (id, update) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === id ? { ...msg, ...update } : msg
        ),
      }))
    },

    removeMessage: (id) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== id),
      }))
    },

    clearMessages: () => set({ messages: [] }),

    isLoading: false,
    setLoading: (loading) => set({ isLoading: loading }),
    isTyping: false,
    setTyping: (typing) => set({ isTyping: typing }),
    isStreaming: false,
    setStreaming: (streaming) => set({ isStreaming: streaming }),
    streamingMessageId: null,
    setStreamingMessageId: (id) => set({ streamingMessageId: id }),

    error: null,
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    inputValue: '',
    setInputValue: (value) => set({ inputValue: value }),

    uploadedResume: null,
    setUploadedResume: (file) => set({ uploadedResume: file }),

    sessionType: 'mixed',
    setSessionType: (type) => set({ sessionType: type }),
    userId: null,
    setUserId: (userId) => set({ userId }),

    orchestrateThreadIds: {},
    setOrchestrateThreadId: (sessionId, threadId) => {
      if (!isValidUuid(threadId)) return
      set((state) => ({
        orchestrateThreadIds: {
          ...state.orchestrateThreadIds,
          [sessionId]: threadId,
        },
      }))
    },

    clearOrchestrateThreadId: (sessionId) => {
      set((state) => {
        const { [sessionId]: _, ...rest } = state.orchestrateThreadIds
        return { orchestrateThreadIds: rest }
      })
    },

    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    mobileDrawerOpen: false,
    setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

    pendingVoiceReply: false,
    setPendingVoiceReply: (pending) => set({ pendingVoiceReply: pending }),
    voiceChatActive: false,
    setVoiceChatActive: (active) => set({ voiceChatActive: active }),
    isSpeakingResponse: false,
    setIsSpeakingResponse: (speaking) => set({ isSpeakingResponse: speaking }),

    sendMessage: async (content) => {
      const {
        currentSession,
        addMessage,
        updateMessage,
        messages,
        updateSessionTitle,
        sessionType,
        orchestrateThreadIds,
        setOrchestrateThreadId,
        clearOrchestrateThreadId,
        uploadedResume,
        setUploadedResume,
      } = get()
      if (!currentSession) return

      const priorUserCount = messages.filter((m) => m.role === 'user').length
      const isFirstUserMessage = priorUserCount === 0

      if (isFirstUserMessage) {
        clearOrchestrateThreadId(currentSession.id)
      }

      // Only reuse in-memory thread IDs from the current browser session.
      // Never reuse IDs restored from the database (may be live-env or stale).
      const orchestrateThreadId = isFirstUserMessage
        ? undefined
        : orchestrateThreadIds[currentSession.id]

      const attachedResume = uploadedResume
      let messageToSend = content

      addMessage({
        sessionId: currentSession.id,
        role: 'user',
        content: attachedResume
          ? `${content}\n\n📎 Resume: ${attachedResume.name}`
          : content,
      })

      set({ inputValue: '', isLoading: true, isTyping: true, error: null })

      if (attachedResume) {
        try {
          const parsedResume = await resumeService.upload({ file: attachedResume })
          const rawText = parsedResume.raw_text?.trim() ?? ''

          if (!rawText) {
            throw new Error(
              'Could not read text from this resume. Try a PDF with selectable text or a .txt file.'
            )
          }

          messageToSend = formatResumeForAgent({
            userMessage: content,
            fileName: attachedResume.name,
            rawText,
            parsed: parsedResume.parsed,
          })
          setUploadedResume(null)
        } catch (error) {
          set({
            isLoading: false,
            isTyping: false,
            error: getErrorMessage(error),
          })
          return
        }
      }

      const assistantId = addMessage({
        sessionId: currentSession.id,
        role: 'assistant',
        content: '',
      })

      set({
        isTyping: false,
        isStreaming: true,
        streamingMessageId: assistantId,
      })

      let streamed = ''

      try {
        await chatService.streamMessage(
          {
            ...(isValidUuid(orchestrateThreadId)
              ? { thread_id: orchestrateThreadId }
              : {}),
            message: messageToSend,
            metadata: { session_type: sessionType, type: sessionType },
          },
          {
            onChunk: (chunk) => {
              if (chunk.thread_id && isValidUuid(chunk.thread_id)) {
                setOrchestrateThreadId(currentSession.id, chunk.thread_id)
              }
              if (chunk.type === 'thread' && chunk.thread_id) {
                setOrchestrateThreadId(currentSession.id, chunk.thread_id)
              }
              if (chunk.type === 'delta' || chunk.type === 'message') {
                streamed += chunk.content ?? ''
                updateMessage(assistantId, { content: streamed })
              }
              if (chunk.type === 'done' && chunk.content) {
                streamed = chunk.content
                updateMessage(assistantId, { content: streamed })
              }
            },
            onError: (error) => {
              set({ error: error.message })
            },
          }
        )
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to send message'
        updateMessage(assistantId, {
          content:
            "I'm having trouble connecting right now. Please try again in a moment.",
        })
        set({ error: message })
      }

      const updatedMessages = get().messages
      const title = deriveTitle(updatedMessages)
      const preview = getSessionPreview(updatedMessages)

      set((state) => ({
        isStreaming: false,
        streamingMessageId: null,
        isLoading: false,
        sessions: state.sessions.map((s) =>
          s.id === currentSession.id
            ? {
                ...s,
                title,
                preview,
                updatedAt: new Date(),
                messageCount: updatedMessages.length,
              }
            : s
        ),
        sessionMessages: {
          ...state.sessionMessages,
          [currentSession.id]: updatedMessages,
        },
        currentSession: state.currentSession
          ? { ...state.currentSession, title, updatedAt: new Date() }
          : null,
      }))

      if (messages.filter((m) => m.role === 'user').length === 0) {
        updateSessionTitle(currentSession.id, title)
      }

      await persistSessionState(get)
    },

    retryMessage: (messageId) => {
      const { messages, sendMessage } = get()
      const index = messages.findIndex((m) => m.id === messageId)
      if (index <= 0) return

      const prevUser = [...messages.slice(0, index)]
        .reverse()
        .find((m) => m.role === 'user')
      if (!prevUser) return

      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }))
      sendMessage(prevUser.content)
    },

    clearSession: () => {
      set({
        currentSession: null,
        messages: [],
        isLoading: false,
        isTyping: false,
        error: null,
        inputValue: '',
        isStreaming: false,
        streamingMessageId: null,
        uploadedResume: null,
      })
    },
  }))
)

export const useCurrentSession = () => useChatStore((state) => state.currentSession)
export const useMessages = () => useChatStore((state) => state.messages)
export const useChatLoading = () => useChatStore((state) => state.isLoading)
export const useChatTyping = () => useChatStore((state) => state.isTyping)
export const useChatError = () => useChatStore((state) => state.error)
export const useInputValue = () => useChatStore((state) => state.inputValue)
export const useChatSidebar = () => useChatStore((state) => state.sidebarOpen)
export const useChatSessions = () => useChatStore((state) => state.sessions)
export const useIsStreaming = () => useChatStore((state) => state.isStreaming)
