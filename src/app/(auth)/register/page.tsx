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
import { RegisterForm } from '@/components/forms/register-form'

export const metadata: Metadata = {
  title: 'Register | AI Interview Trainer',
  description: 'Create your AI Interview Trainer account',
}

export default function RegisterPage() {
  return (
    <AuthShell>
      <AuthGlassCard
        title="Create your account"
        description="Create your account to start practicing interviews with AI coaching."
        footer={
          <p className={authFooterTextClassName}>
            Already have an account?{' '}
            <Link href="/login" className={authFooterLinkClassName}>
              Sign in
            </Link>
          </p>
        }
      >
        <Suspense fallback={null}>
          <AuthErrorAlert />
        </Suspense>
        <RegisterForm />
      </AuthGlassCard>
    </AuthShell>
  )
}
