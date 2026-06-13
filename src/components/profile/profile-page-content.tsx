'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/page-header'
import { ProfileCard } from '@/components/profile/profile-card'
import { ProfileAccountActions } from '@/components/profile/profile-account-actions'
import { useAppData } from '@/hooks/use-app-data'
import type { UserProfile } from '@/types/profile'

const ProfileEditor = dynamic(
  () =>
    import('@/components/profile/profile-editor').then((mod) => mod.ProfileEditor),
  { loading: () => <div className="h-80 animate-pulse rounded-2xl bg-muted/40" /> }
)

const ProfileSettingsSection = dynamic(
  () =>
    import('@/components/profile/profile-settings-section').then(
      (mod) => mod.ProfileSettingsSection
    ),
  { loading: () => <div className="h-48 animate-pulse rounded-2xl bg-muted/30" /> }
)

function profileFromSession(user: {
  name?: string | null
  email?: string | null
  image?: string | null
}): UserProfile {
  return {
    name: user.name ?? 'User',
    email: user.email ?? '',
    avatar: user.image ?? '',
    experienceLevel: 'intermediate',
    skills: [],
    targetRole: '',
  }
}

export function ProfilePageContent() {
  const { data: session, update: updateSession } = useSession()
  const searchParams = useSearchParams()
  const { data, isLoading, updateProfile, reload } = useAppData()
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const status = searchParams.get('emailChange')
    const email = searchParams.get('email')

    if (status === 'success') {
      toast.success(
        email
          ? `Email updated to ${email}`
          : 'Your email address was updated successfully'
      )
      void reload()
      void updateSession({
        user: email ? { email } : undefined,
      })
      window.history.replaceState({}, '', '/profile')
      return
    }

    if (status === 'unavailable') {
      toast.error('Could not update email. It may already be in use.')
      window.history.replaceState({}, '', '/profile')
      return
    }

    if (status === 'invalid') {
      toast.error(
        'This verification link is invalid or has expired. Save your profile again to get a new link.'
      )
      window.history.replaceState({}, '', '/profile')
    }
  }, [reload, searchParams, updateSession])

  const profile = useMemo(() => {
    if (data?.profile) return data.profile
    if (session?.user) return profileFromSession(session.user)
    return null
  }, [data?.profile, session?.user])

  const handleAvatarChange = (url: string) => {
    if (!profile) return
    void updateProfile({ ...profile, avatar: url })
  }

  const handleSave = async (
    updated: UserProfile,
    options?: { currentPassword?: string }
  ) => {
    try {
      const result = await updateProfile(updated, options)
      setIsEditing(false)

      if (result?.emailChangeSent && result.pendingEmail) {
        toast.success(`Verification link sent to ${result.pendingEmail}`)
        return
      }

      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile'
      )
      throw error
    }
  }

  if (!profile && isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <PageHeader
          title="Profile"
          description="Manage your profile, preferences, and account settings."
        />
        <div className="h-80 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Profile"
        description="Manage your profile, preferences, and account settings."
      />

      {isEditing ? (
        <ProfileEditor
          profile={profile}
          pendingEmail={data?.pendingEmail}
          emailManagedByGoogle={data?.emailManagedByGoogle}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          onAvatarChange={handleAvatarChange}
        />
      ) : (
        <ProfileCard
          profile={profile}
          onEdit={() => setIsEditing(true)}
          onAvatarChange={handleAvatarChange}
        />
      )}

      {!isEditing && (
        <>
          <ProfileSettingsSection />
          <ProfileAccountActions />
        </>
      )}
    </div>
  )
}
