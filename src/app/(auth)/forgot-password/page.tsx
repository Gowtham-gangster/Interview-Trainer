import { Metadata } from 'next'

import { AuthGlassCard } from '@/components/auth/auth-glass-card'
import { AuthShell } from '@/components/auth/auth-shell'
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form'

export const metadata: Metadata = {
  title: 'Forgot Password | AI Interview Trainer',
  description: 'Reset your AI Interview Trainer account password',
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <AuthGlassCard
        title="Forgot password?"
        description="Enter your email and we'll send you a link to reset your password."
      >
        <ForgotPasswordForm />
      </AuthGlassCard>
    </AuthShell>
  )
}
