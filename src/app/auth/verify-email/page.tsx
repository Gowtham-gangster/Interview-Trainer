'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'

import { AuthGlassCard } from '@/components/auth/auth-glass-card'
import {
  authFooterLinkClassName,
  authFooterTextClassName,
} from '@/components/auth/auth-form-styles'
import { AuthShell } from '@/components/auth/auth-shell'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const email = searchParams.get('email')
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (status === 'success') {
      toast.success('Email verified. You can sign in now.')
    }
  }, [status])

  const handleResend = async () => {
    if (!email) {
      toast.error('Enter your email on the registration form to resend verification.')
      return
    }

    setIsResending(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        toast.error(result.message ?? 'Could not resend verification email')
        return
      }
      toast.success(result.message ?? 'Verification email sent')
    } catch {
      toast.error('Could not resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  const title =
    status === 'success'
      ? 'Email verified'
      : status === 'invalid'
        ? 'Verification link expired'
        : 'Verify your email'

  const description =
    status === 'success'
      ? 'Your email address is confirmed. Sign in to start practicing interviews.'
      : status === 'invalid'
        ? 'This verification link is invalid or has expired. Request a new email below.'
        : email
          ? `We sent a verification link to ${email}. Open it to continue setting up your account.`
          : 'Check your inbox for the verification link to activate your account.'

  return (
    <AuthGlassCard
      title={title}
      description={description}
      footer={
        <p className={authFooterTextClassName}>
          <Link href="/login" className={authFooterLinkClassName}>
            Back to sign in
          </Link>
        </p>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
          <MailCheck className="h-6 w-6" />
        </div>

        {status !== 'success' && email ? (
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={isResending}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-500/30 px-4 text-sm font-medium text-cyan-600 transition-colors hover:bg-cyan-50 disabled:opacity-60 dark:text-cyan-400 dark:hover:bg-cyan-950/40"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend verification email'
            )}
          </button>
        ) : null}

        {status === 'success' ? (
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-b from-cyan-400 to-blue-600 px-5 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </AuthGlassCard>
  )
}

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </AuthShell>
  )
}
