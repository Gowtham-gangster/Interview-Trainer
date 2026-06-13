import { createEmailChangeToken, getPendingEmailChange } from '@/lib/auth/email-verification'
import { LEGACY_DEFAULT_PROFILE } from '@/lib/auth/profile-defaults'
import { parseRegistrationEmail } from '@/lib/auth/registration-email'
import { getEmailChangeConflict, verifyCurrentPassword } from '@/lib/auth/user-store'
import type { AppSettings } from '@/lib/data/app-storage'
import { defaultSettings } from '@/lib/data/app-storage'
import { getAppBaseUrl } from '@/lib/email/config'
import { isEmailConfigured, sendEmailChangeVerificationSafe } from '@/lib/email/mailer'
import { prisma } from '@/lib/db/prisma'
import type { ExperienceLevel, UserProfile } from '@/types/profile'

export interface OnboardingProfileInput {
  targetRole: string
  experienceLevel: ExperienceLevel
  skills: string[]
}

export interface UserAppDataRecord {
  profile: UserProfile
  settings: AppSettings
  onboardingCompleted: boolean
  updatedAt: string
  pendingEmail?: string | null
  emailManagedByGoogle?: boolean
  emailChangeSent?: boolean
}

function isEmailManagedByGoogle(user: {
  passwordHash: string | null
  accounts: { provider: string }[]
}): boolean {
  const hasGoogle = user.accounts.some((account) => account.provider === 'google')
  return hasGoogle && !user.passwordHash
}

async function buildUserAppDataRecord(user: {
  id: string
  name: string | null
  email: string | null
  image: string | null
  passwordHash: string | null
  accounts: { provider: string }[]
  profile: {
    experienceLevel: string
    skills: string[]
    targetRole: string
    onboardingCompleted: boolean
  } | null
  settings: {
    theme: string
    language: string
    emailNotifications: boolean
    pushNotifications: boolean
    interviewReminders: boolean
    productUpdates: boolean
    browserNotifications: boolean
    soundAlerts: boolean
    updatedAt: Date
  } | null
}): Promise<UserAppDataRecord> {
  const settings =
    user.settings ??
    (await prisma.userSettings.create({
      data: { userId: user.id },
    }))

  const pendingEmail = await getPendingEmailChange(user.id)

  return {
    profile: {
      name: user.name ?? 'User',
      email: user.email ?? '',
      avatar: user.image ?? '',
      experienceLevel: (user.profile?.experienceLevel ??
        'intermediate') as UserProfile['experienceLevel'],
      skills: user.profile?.skills ?? [],
      targetRole: user.profile?.targetRole ?? '',
    },
    settings: toAppSettings(settings),
    onboardingCompleted: user.profile?.onboardingCompleted ?? false,
    updatedAt: settings.updatedAt.toISOString(),
    pendingEmail,
    emailManagedByGoogle: isEmailManagedByGoogle(user),
  }
}

function toAppSettings(record: {
  theme: string
  language: string
  emailNotifications: boolean
  pushNotifications: boolean
  interviewReminders: boolean
  productUpdates: boolean
  browserNotifications: boolean
  soundAlerts: boolean
}): AppSettings {
  return {
    theme: record.theme as AppSettings['theme'],
    language: record.language,
    emailNotifications: record.emailNotifications,
    pushNotifications: record.pushNotifications,
    interviewReminders: record.interviewReminders,
    productUpdates: record.productUpdates,
    browserNotifications: record.browserNotifications,
    soundAlerts: record.soundAlerts,
  }
}

function defaultProfile(name: string, email: string, avatar?: string): UserProfile {
  return {
    name,
    email,
    avatar: avatar ?? '',
    experienceLevel: 'intermediate',
    skills: ['Communication', 'Problem Solving', 'Teamwork'],
    targetRole: 'Software Engineer',
  }
}

export async function getOrCreateUserAppData(
  userId: string,
  name: string,
  email: string,
  avatar?: string
): Promise<UserAppDataRecord> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      settings: true,
      accounts: { select: { provider: true } },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  if (!user.profile) {
    await prisma.userProfile.create({
      data: {
        userId,
        ...LEGACY_DEFAULT_PROFILE,
      },
    })
  }

  const refreshedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      settings: true,
      accounts: { select: { provider: true } },
    },
  })

  if (!refreshedUser) {
    throw new Error('User not found')
  }

  return buildUserAppDataRecord({
    ...refreshedUser,
    name: refreshedUser.name ?? name,
    email: refreshedUser.email ?? email,
    image: refreshedUser.image ?? avatar ?? null,
  })
}

export async function completeUserOnboarding(
  userId: string,
  input: OnboardingProfileInput
): Promise<UserAppDataRecord> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, settings: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      targetRole: input.targetRole,
      experienceLevel: input.experienceLevel,
      skills: input.skills,
      onboardingCompleted: true,
    },
    update: {
      targetRole: input.targetRole,
      experienceLevel: input.experienceLevel,
      skills: input.skills,
      onboardingCompleted: true,
    },
  })

  const settings =
    user.settings ??
    (await prisma.userSettings.create({
      data: { userId },
    }))

  return {
    profile: {
      name: user.name ?? 'User',
      email: user.email ?? '',
      avatar: user.image ?? '',
      experienceLevel: profile.experienceLevel as UserProfile['experienceLevel'],
      skills: profile.skills,
      targetRole: profile.targetRole,
    },
    settings: toAppSettings(settings),
    onboardingCompleted: true,
    updatedAt: settings.updatedAt.toISOString(),
  }
}

export async function updateUserProfile(
  userId: string,
  profile: UserProfile,
  options?: { currentPassword?: string }
): Promise<UserAppDataRecord> {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: { select: { provider: true } },
    },
  })

  if (!currentUser) {
    throw new Error('User not found')
  }

  const currentEmail = currentUser.email?.trim().toLowerCase() ?? ''
  const requestedEmail = profile.email.trim().toLowerCase()
  let emailChangeSent = false

  if (requestedEmail !== currentEmail) {
    if (isEmailManagedByGoogle(currentUser)) {
      throw new Error(
        'Your email is linked to Google Sign-In. Manage it from your Google account.'
      )
    }

    const parsed = parseRegistrationEmail(requestedEmail)
    if (!parsed.ok) {
      throw new Error(parsed.message)
    }

    const conflict = await getEmailChangeConflict(parsed.email, userId)
    if (conflict) {
      throw new Error(conflict.message)
    }

    if (!isEmailConfigured()) {
      throw new Error(
        'Email verification is not configured. Contact support to change your email.'
      )
    }

    if (!currentUser.passwordHash) {
      throw new Error(
        'Add a password to your account before changing your email address.'
      )
    }

    if (!options?.currentPassword?.trim()) {
      throw new Error('Enter your current password to change your email address.')
    }

    const passwordValid = await verifyCurrentPassword(
      userId,
      options.currentPassword
    )
    if (!passwordValid) {
      throw new Error('Incorrect password. Email change was not started.')
    }

    const token = await createEmailChangeToken(userId, parsed.email)
    await sendEmailChangeVerificationSafe({
      to: parsed.email,
      userName: profile.name,
      newEmail: parsed.email,
      verifyUrl: `${getAppBaseUrl()}/api/auth/verify-email?token=${token}`,
    })
    emailChangeSent = true
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: profile.name,
      image: profile.avatar || null,
      profile: {
        upsert: {
          create: {
            experienceLevel: profile.experienceLevel,
            skills: profile.skills,
            targetRole: profile.targetRole,
            onboardingCompleted: true,
          },
          update: {
            experienceLevel: profile.experienceLevel,
            skills: profile.skills,
            targetRole: profile.targetRole,
            onboardingCompleted: true,
          },
        },
      },
    },
    include: {
      profile: true,
      settings: true,
      accounts: { select: { provider: true } },
    },
  })

  const record = await buildUserAppDataRecord(user)

  return {
    ...record,
    emailChangeSent,
    pendingEmail: emailChangeSent ? requestedEmail : record.pendingEmail,
  }
}

export async function updateUserSettings(
  userId: string,
  settingsInput: AppSettings
): Promise<UserAppDataRecord> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      theme: settingsInput.theme,
      language: settingsInput.language,
      emailNotifications: settingsInput.emailNotifications,
      pushNotifications: settingsInput.pushNotifications,
      interviewReminders: settingsInput.interviewReminders,
      productUpdates: settingsInput.productUpdates,
      browserNotifications: settingsInput.browserNotifications,
      soundAlerts: settingsInput.soundAlerts,
    },
    update: {
      theme: settingsInput.theme,
      language: settingsInput.language,
      emailNotifications: settingsInput.emailNotifications,
      pushNotifications: settingsInput.pushNotifications,
      interviewReminders: settingsInput.interviewReminders,
      productUpdates: settingsInput.productUpdates,
      browserNotifications: settingsInput.browserNotifications,
      soundAlerts: settingsInput.soundAlerts,
    },
  })

  const profile = user.profile

  return {
    profile: profile
      ? {
          name: user.name ?? 'User',
          email: user.email ?? '',
          avatar: user.image ?? '',
          experienceLevel: profile.experienceLevel as UserProfile['experienceLevel'],
          skills: profile.skills,
          targetRole: profile.targetRole,
        }
      : defaultProfile(user.name ?? 'User', user.email ?? ''),
    settings: toAppSettings(settings),
    onboardingCompleted: profile?.onboardingCompleted ?? true,
    updatedAt: settings.updatedAt.toISOString(),
  }
}

export async function resetUserAppData(
  userId: string,
  name: string,
  email: string
): Promise<UserAppDataRecord> {
  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...LEGACY_DEFAULT_PROFILE,
    },
    update: {
      ...LEGACY_DEFAULT_PROFILE,
    },
  })

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      theme: defaultSettings.theme,
      language: defaultSettings.language,
      emailNotifications: defaultSettings.emailNotifications,
      pushNotifications: defaultSettings.pushNotifications,
      interviewReminders: defaultSettings.interviewReminders,
      productUpdates: defaultSettings.productUpdates,
      browserNotifications: defaultSettings.browserNotifications,
      soundAlerts: defaultSettings.soundAlerts,
    },
    update: {
      theme: defaultSettings.theme,
      language: defaultSettings.language,
      emailNotifications: defaultSettings.emailNotifications,
      pushNotifications: defaultSettings.pushNotifications,
      interviewReminders: defaultSettings.interviewReminders,
      productUpdates: defaultSettings.productUpdates,
      browserNotifications: defaultSettings.browserNotifications,
      soundAlerts: defaultSettings.soundAlerts,
    },
  })

  return {
    profile: defaultProfile(name, email),
    settings: toAppSettings(settings),
    onboardingCompleted: true,
    updatedAt: settings.updatedAt.toISOString(),
  }
}
