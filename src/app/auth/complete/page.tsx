'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'
import { userDataQueryKey } from '@/hooks/use-app-data'
import { fetchUserAppData } from '@/lib/api/user-data-service'

export default function AuthCompletePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session, status } = useSession()

  useEffect(() => {
    router.prefetch('/chat')
    router.prefetch('/onboarding')
  }, [router])

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return

    void queryClient.prefetchQuery({
      queryKey: userDataQueryKey(session.user.id),
      queryFn: fetchUserAppData,
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient, session?.user?.id, status])

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.replace('/login?error=SessionRequired')
      return
    }

    if (session?.onboardingCompleted === false) {
      router.replace('/onboarding')
      return
    }

    router.replace('/chat')
  }, [router, session?.onboardingCompleted, status])

  return (
    <AuthShell>
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Signing you in...
        </p>
      </div>
    </AuthShell>
  )
}
