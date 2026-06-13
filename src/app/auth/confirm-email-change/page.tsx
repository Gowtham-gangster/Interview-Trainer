'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, Lock, MailCheck } from 'lucide-react'
import { toast } from 'sonner'

import { AuthGlassCard } from '@/components/auth/auth-glass-card'
import {
  authFooterLinkClassName,
  authFooterTextClassName,
  authInputClassName,
  authLabelClassName,
} from '@/components/auth/auth-form-styles'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ConfirmEmailChangeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const token = searchParams.get('token')?.trim() ?? ''

  const [newEmail, setNewEmail] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoadError('Verification link is missing or invalid.')
      setIsFetching(false)
      return
    }

    if (status === 'loading') return

    if (status === 'unauthenticated') {
      const callbackUrl = `/auth/confirm-email-change?token=${encodeURIComponent(token)}`
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }

    let cancelled = false

    const load = async () => {
      setIsFetching(true)
      try {
        const response = await fetch(
          `/api/auth/confirm-email-change?token=${encodeURIComponent(token)}`
        )
        const result = (await response.json()) as {
          newEmail?: string
          message?: string
        }

        if (!response.ok) {
          if (!cancelled) {
            setLoadError(result.message ?? 'Could not load verification details.')
          }
          return
        }

        if (!cancelled) {
          setNewEmail(result.newEmail ?? null)
          setLoadError(null)
        }
      } catch {
        if (!cancelled) {
          setLoadError('Could not load verification details.')
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [router, status, token])

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!token) return

    if (!password.trim()) {
      toast.error('Enter your current password to confirm this change.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/confirm-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const result = (await response.json()) as {
        email?: string
        message?: string
      }

      if (!response.ok) {
        toast.error(result.message ?? 'Could not confirm email change')
        return
      }

      toast.success(result.message ?? 'Email updated successfully')
      router.replace(
        `/profile?emailChange=success&email=${encodeURIComponent(result.email ?? newEmail ?? '')}`
      )
    } catch {
      toast.error('Could not confirm email change')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching || status === 'loading') {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (loadError || !newEmail) {
    return (
      <AuthGlassCard
        title="Verification link expired"
        description={
          loadError ??
          'This verification link is invalid or has expired. Save your profile again to request a new link.'
        }
        footer={
          <p className={authFooterTextClassName}>
            <Link href="/profile" className={authFooterLinkClassName}>
              Back to profile
            </Link>
          </p>
        }
      >
        <div className="flex justify-center py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
            <MailCheck className="h-6 w-6" />
          </div>
        </div>
      </AuthGlassCard>
    )
  }

  return (
    <AuthGlassCard
      title="Confirm your new email"
      description={`Enter your current password to confirm changing your account email to ${newEmail}.`}
      footer={
        <p className={authFooterTextClassName}>
          <Link href="/profile" className={authFooterLinkClassName}>
            Back to profile
          </Link>
        </p>
      }
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        <div className="flex justify-center py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
            <MailCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className={authLabelClassName}>
            Current password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="confirm-password"
              type="password"
              autoComplete="current-password"
              className={`${authInputClassName} pl-10`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming...
            </>
          ) : (
            'Confirm email change'
          )}
        </Button>
      </form>
    </AuthGlassCard>
  )
}

export default function ConfirmEmailChangePage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
          </div>
        }
      >
        <ConfirmEmailChangeContent />
      </Suspense>
    </AuthShell>
  )
}
