'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { AuthShell } from '@/components/auth/auth-shell'

function VerifyEmailCompleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return

    if (!token) {
      router.replace('/auth/verify-email?status=invalid')
      return
    }

    startedRef.current = true

    const completeSignIn = async () => {
      try {
        const result = await signIn('credentials', {
          verificationToken: token,
          email: 'verified@session.local',
          password: 'verified-session',
          redirect: false,
        })

        if (result?.error) {
          toast.error('Could not sign you in after verification. Please sign in manually.')
          router.replace('/login')
          return
        }

        router.replace('/auth/complete')
      } catch {
        toast.error('Could not sign you in after verification. Please sign in manually.')
        router.replace('/login')
      }
    }

    void completeSignIn()
  }, [router, token])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Email verified. Setting up your account...
      </p>
    </div>
  )
}

export default function VerifyEmailCompletePage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        }
      >
        <VerifyEmailCompleteContent />
      </Suspense>
    </AuthShell>
  )
}
