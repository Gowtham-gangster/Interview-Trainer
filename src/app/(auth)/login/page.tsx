import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { AuthErrorAlert } from '@/components/auth/auth-error-alert'
import { AuthGlassCard } from '@/components/auth/auth-glass-card'
import {
  authFooterLinkClassName,
  authFooterTextClassName,
} from '@/components/auth/auth-form-styles'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/forms/login-form'

export const metadata: Metadata = {
  title: 'Login | AI Interview Trainer',
  description: 'Sign in to your AI Interview Trainer account',
}

export default function LoginPage() {
  return (
    <AuthShell>
      <AuthGlassCard
        title="Welcome back"
        description="Sign in to continue your interview preparation journey."
        footer={
          <p className={authFooterTextClassName}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className={authFooterLinkClassName}>
              Create account
            </Link>
          </p>
        }
      >
        <Suspense fallback={null}>
          <AuthErrorAlert />
        </Suspense>
        <LoginForm />
      </AuthGlassCard>
    </AuthShell>
  )
}
