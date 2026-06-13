import { Metadata } from 'next'
import { Suspense } from 'react'

import { ProfilePageContent } from '@/components/profile/profile-page-content'

export const metadata: Metadata = {
  title: 'Profile | AI Interview Trainer',
  description: 'Manage your profile, skills, and career goals',
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  )
}
