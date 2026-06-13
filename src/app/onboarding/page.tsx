import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { AuthGlassCard } from '@/components/auth/auth-glass-card'
import { AuthShell } from '@/components/auth/auth-shell'
import { OnboardingForm } from '@/components/forms/onboarding-form'
import { getOnboardingCompleted } from '@/lib/auth/onboarding'
import { authOptions } from '@/lib/auth/auth-options'

export const metadata: Metadata = {
  title: 'Set up your profile | AI Interview Trainer',
  description: 'Tell us about your goals to personalize your interview practice',
}

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/onboarding')
  }

  const onboardingCompleted = await getOnboardingCompleted(session.user.id)
  if (onboardingCompleted) {
    redirect('/chat')
  }

  return (
    <AuthShell>
      <AuthGlassCard
        title="Welcome! Let's personalize your prep"
        description="Share your target role, experience, and skills so we can tailor interview questions for you."
      >
        <OnboardingForm />
      </AuthGlassCard>
    </AuthShell>
  )
}
