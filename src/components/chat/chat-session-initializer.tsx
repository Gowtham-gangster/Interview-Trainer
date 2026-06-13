'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

import { fetchChatSessions } from '@/lib/api/chat-session-service'
import { useChatStore } from '@/lib/store/chat-store'

interface ChatSessionInitializerProps {
  sessionType?: string
  initialSessionId?: string
}

let hydratedUserId: string | null = null

async function syncOrchestrateEnvironment(
  clearAllOrchestrateThreadIds: () => void
) {
  try {
    const healthRes = await fetch('/api/health')
    if (!healthRes.ok) return

    const health = (await healthRes.json()) as {
      orchestrate?: { environment_id?: string }
    }
    const envId = health.orchestrate?.environment_id ?? ''
    const storageKey = 'orchestrate_environment_id'
    const previousEnvId = sessionStorage.getItem(storageKey)

    if (previousEnvId && envId && previousEnvId !== envId) {
      clearAllOrchestrateThreadIds()
    }

    if (envId) {
      sessionStorage.setItem(storageKey, envId)
    }
  } catch {
    // Non-blocking: chat can load without health metadata.
  }
}

function hasValidActiveSession(userId: string): boolean {
  const { sessions, currentSession } = useChatStore.getState()
  return (
    sessions.length > 0 &&
    Boolean(currentSession) &&
    sessions.some((session) => session.id === currentSession?.id) &&
    useChatStore.getState().userId === userId
  )
}

export function ChatSessionInitializer({
  sessionType,
  initialSessionId,
}: ChatSessionInitializerProps) {
  const { data: session, status } = useSession()
  const setSessionType = useChatStore((state) => state.setSessionType)
  const setUserId = useChatStore((state) => state.setUserId)
  const createNewChat = useChatStore((state) => state.createNewChat)
  const activeType = useChatStore((state) => state.sessionType)
  const hydrateSessions = useChatStore((state) => state.hydrateSessions)
  const clearAllOrchestrateThreadIds = useChatStore(
    (state) => state.clearAllOrchestrateThreadIds
  )
  const selectSession = useChatStore((state) => state.selectSession)

  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id)
      return
    }

    hydratedUserId = null
    setUserId(null)
  }, [session?.user?.id, setUserId])

  useEffect(() => {
    if (!sessionType) return

    if (activeType !== sessionType) {
      setSessionType(sessionType)
      createNewChat()
    }
  }, [sessionType, activeType, setSessionType, createNewChat])

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return

    const userId = session.user.id

    if (hydratedUserId === userId && hasValidActiveSession(userId)) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const [, sessionsResult] = await Promise.all([
          syncOrchestrateEnvironment(clearAllOrchestrateThreadIds),
          fetchChatSessions(),
        ])

        if (cancelled) return

        const { sessions } = sessionsResult
        const state = useChatStore.getState()

        if (sessions.length === 0) {
          if (!state.currentSession) {
            createNewChat()
          }
          hydratedUserId = userId
          return
        }

        hydrateSessions(sessions)

        const keepCurrent =
          state.currentSession &&
          sessions.some((item) => item.id === state.currentSession?.id)

        const preferredSessionId =
          initialSessionId &&
          sessions.some((item) => item.id === initialSessionId)
            ? initialSessionId
            : keepCurrent
              ? state.currentSession!.id
              : sessions[0].id

        selectSession(preferredSessionId)
        hydratedUserId = userId
      } catch {
        if (cancelled) return

        const state = useChatStore.getState()
        if (!state.currentSession && state.sessions.length === 0) {
          createNewChat()
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    createNewChat,
    clearAllOrchestrateThreadIds,
    hydrateSessions,
    initialSessionId,
    selectSession,
    session?.user?.id,
    status,
  ])

  useEffect(() => {
    if (!initialSessionId || status !== 'authenticated') return

    const { sessions } = useChatStore.getState()
    if (sessions.some((item) => item.id === initialSessionId)) {
      selectSession(initialSessionId)
    }
  }, [initialSessionId, selectSession, status])

  return null
}
