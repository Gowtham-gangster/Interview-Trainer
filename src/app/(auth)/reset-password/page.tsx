import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { AuthGlassCard } from '@/components/auth/auth-glass-card'
import { AuthShell } from '@/components/auth/auth-shell'
import { ResetPasswordForm } from '@/components/forms/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset Password | AI Interview Trainer',
  description: 'Set a new password for your AI Interview Trainer account',
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <AuthGlassCard
        title="Set new password"
        description="Choose a strong password for your account."
        footer={
          <p className="text-center text-sm text-slate-400">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
            >
              Sign in
            </Link>
          </p>
        }
      >
        <Suspense
          fallback={
            <p className="text-center text-sm text-slate-400">Loading...</p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </AuthGlassCard>
    </AuthShell>
  )
}
