import { create } from 'zustand'

interface ApiLoadingState {
  /** Set of active loading keys (e.g. 'chat:send', 'threads:list') */
  loadingKeys: Set<string>
  /** Global counter for any in-flight request */
  pendingCount: number

  startLoading: (key: string) => void
  stopLoading: (key: string) => void
  isLoading: (key?: string) => boolean
  reset: () => void
}

export const useApiLoadingStore = create<ApiLoadingState>((set, get) => ({
  loadingKeys: new Set(),
  pendingCount: 0,

  startLoading: (key) => {
    set((state) => {
      const loadingKeys = new Set(state.loadingKeys)
      loadingKeys.add(key)
      return { loadingKeys, pendingCount: state.pendingCount + 1 }
    })
  },

  stopLoading: (key) => {
    set((state) => {
      const loadingKeys = new Set(state.loadingKeys)
      loadingKeys.delete(key)
      return {
        loadingKeys,
        pendingCount: Math.max(0, state.pendingCount - 1),
      }
    })
  },

  isLoading: (key) => {
    const { loadingKeys, pendingCount } = get()
    if (!key) return pendingCount > 0
    return loadingKeys.has(key)
  },

  reset: () => set({ loadingKeys: new Set(), pendingCount: 0 }),
}))

export const LOADING_KEYS = {
  CHAT_SEND: 'chat:send',
  CHAT_STREAM: 'chat:stream',
  CHAT_HISTORY: 'chat:history',
  THREAD_CREATE: 'thread:create',
  THREAD_LIST: 'thread:list',
  MESSAGE_LIST: 'message:list',
  CONVERSATION_LIST: 'conversation:list',
  CONVERSATION_CREATE: 'conversation:create',
  RESUME_UPLOAD: 'resume:upload',
  RESUME_LIST: 'resume:list',
  RESUME_STATUS: 'resume:status',
  RESUME_ANALYZE: 'resume:analyze',
  VOICE_TRANSCRIBE: 'voice:transcribe',
  VOICE_SYNTHESIZE: 'voice:synthesize',
  VOICE_SESSION: 'voice:session',
  HEALTH: 'health',
} as const

export type LoadingKey = (typeof LOADING_KEYS)[keyof typeof LOADING_KEYS]
