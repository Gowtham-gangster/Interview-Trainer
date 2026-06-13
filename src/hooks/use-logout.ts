'use client'

import { useCallback, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'

import { useChatStore } from '@/lib/store/chat-store'

export function useLogout() {
  const queryClient = useQueryClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = useCallback(async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    queryClient.clear()

    const { clearSession, setUserId } = useChatStore.getState()
    clearSession()
    setUserId(null)

    try {
      await signOut({ redirect: false })
    } catch {
      // Still send the user to the landing page if sign-out API fails.
    }

    window.location.assign('/')
  }, [isLoggingOut, queryClient])

  return { logout, isLoggingOut }
}
