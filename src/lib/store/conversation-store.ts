import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ConversationType } from '@/lib/api/types/conversation'

interface ConversationStore {
  activeConversationId: string | null
  activeConversationType: ConversationType | null
  setActiveConversation: (
    id: string | null,
    type?: ConversationType | null
  ) => void
  clearActiveConversation: () => void
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set) => ({
      activeConversationId: null,
      activeConversationType: null,
      setActiveConversation: (id, type = null) =>
        set({ activeConversationId: id, activeConversationType: type }),
      clearActiveConversation: () =>
        set({ activeConversationId: null, activeConversationType: null }),
    }),
    { name: 'active-conversation' }
  )
)
