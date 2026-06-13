import bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'

import { parseRegistrationEmail } from '@/lib/auth/registration-email'
import { prisma } from '@/lib/db/prisma'

export interface StoredUser {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

const BCRYPT_ROUNDS = 12

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash)
}

function toStoredUser(user: {
  id: string
  name: string | null
  email: string | null
  passwordHash: string | null
  createdAt: Date
}): StoredUser | null {
  if (!user.email || !user.passwordHash) return null

  return {
    id: user.id,
    name: user.name ?? 'User',
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt.toISOString(),
  }
}

export type EmailRegistrationConflict = {
  type: 'taken' | 'google_only'
  message: string
}

export async function getEmailChangeConflict(
  email: string,
  excludeUserId: string
): Promise<EmailRegistrationConflict | null> {
  const parsed = parseRegistrationEmail(email)
  if (!parsed.ok) {
    return {
      type: 'taken',
      message: parsed.message,
    }
  }

  const existing = await prisma.user.findFirst({
    where: { email: parsed.email },
    include: { accounts: { select: { provider: true } } },
  })

  if (!existing || existing.id === excludeUserId) return null

  const hasGoogle = existing.accounts.some(
    (account) => account.provider === 'google'
  )
  const hasPassword = Boolean(existing.passwordHash)

  if (hasGoogle && !hasPassword) {
    return {
      type: 'google_only',
      message:
        'This email is already linked to a Google account. Sign in with Google instead.',
    }
  }

  return {
    type: 'taken',
    message: 'This email is already used by another account.',
  }
}

export async function verifyCurrentPassword(
  userId: string,
  password: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  })

  if (!user?.passwordHash) return false

  return verifyPassword(password, user.passwordHash)
}

export async function changeUserEmail(
  userId: string,
  newEmail: string
): Promise<boolean> {
  const parsed = parseRegistrationEmail(newEmail)
  if (!parsed.ok) return false

  const conflict = await getEmailChangeConflict(parsed.email, userId)
  if (conflict) return false

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: parsed.email,
      emailVerified: new Date(),
    },
  })

  return true
}

export async function getEmailRegistrationConflict(
  email: string
): Promise<EmailRegistrationConflict | null> {
  const parsed = parseRegistrationEmail(email)
  if (!parsed.ok) return null

  const existing = await prisma.user.findFirst({
    where: { email: parsed.email },
    include: { accounts: { select: { provider: true } } },
  })

  if (!existing) return null

  const hasGoogle = existing.accounts.some(
    (account) => account.provider === 'google'
  )
  const hasPassword = Boolean(existing.passwordHash)

  if (hasGoogle && !hasPassword) {
    return {
      type: 'google_only',
      message:
        'This email is already registered with Google. Use Sign up with Google instead.',
    }
  }

  return {
    type: 'taken',
    message:
      'An account with this email already exists. Please sign in instead.',
  }
}

export async function createUser(
  name: string,
  email: string,
  password: string,
  options?: { requireEmailVerification?: boolean }
): Promise<StoredUser> {
  const parsed = parseRegistrationEmail(email)
  if (!parsed.ok) {
    throw new Error(parsed.message)
  }

  const normalizedEmail = parsed.email
  const conflict = await getEmailRegistrationConflict(normalizedEmail)

  if (conflict) {
    throw new Error(conflict.message)
  }

  const passwordHash = await hashPassword(password)

  try {
    const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      emailVerified: options?.requireEmailVerification ? null : new Date(),
      passwordHash,
      profile: {
        create: {
          experienceLevel: 'intermediate',
          skills: [],
          targetRole: '',
          onboardingCompleted: false,
        },
      },
      settings: {
        create: {},
      },
    },
    })

    const stored = toStoredUser(user)
    if (!stored) {
      throw new Error('Failed to create user')
    }

    return stored
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error(
        'An account with this email already exists. Please sign in instead.'
      )
    }
    throw error
  }
}

export type VerifyUserResult =
  | { status: 'ok'; user: StoredUser & { onboardingCompleted: boolean } }
  | { status: 'invalid' }
  | { status: 'unverified'; email: string }

export async function verifyUser(
  email: string,
  password: string,
  options?: { requireEmailVerification?: boolean }
): Promise<VerifyUserResult> {
  const parsed = parseRegistrationEmail(email)
  if (!parsed.ok) {
    return { status: 'invalid' }
  }

  const user = await prisma.user.findFirst({
    where: { email: parsed.email },
    include: { profile: { select: { onboardingCompleted: true } } },
  })

  if (!user?.passwordHash) {
    return { status: 'invalid' }
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return { status: 'invalid' }
  }

  if (options?.requireEmailVerification && !user.emailVerified) {
    return { status: 'unverified', email: parsed.email }
  }

  const stored = toStoredUser(user)
  if (!stored) {
    return { status: 'invalid' }
  }

  return {
    status: 'ok',
    user: {
      ...stored,
      onboardingCompleted: user.profile?.onboardingCompleted ?? false,
    },
  }
}

export async function markEmailVerified(email: string): Promise<boolean> {
  const parsed = parseRegistrationEmail(email)
  if (!parsed.ok) return false

  const user = await prisma.user.findFirst({
    where: { email: parsed.email },
    select: { id: true },
  })

  if (!user) return false

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  })

  return true
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  })

  if (!user) return null
  return toStoredUser(user) ?? {
    id: user.id,
    name: user.name ?? 'User',
    email: user.email ?? email,
    passwordHash: user.passwordHash ?? '',
    createdAt: user.createdAt.toISOString(),
  }
}

export async function updateUserPassword(
  email: string,
  newPassword: string,
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user) return false

  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  return true
}

export type PasswordResetEligibility =
  | { status: 'not_found' }
  | { status: 'eligible'; email: string; name: string | null }

export async function getPasswordResetEligibility(
  email: string
): Promise<PasswordResetEligibility> {
  const user = await prisma.user.findFirst({
    where: { email: email.trim().toLowerCase() },
    select: {
      email: true,
      name: true,
    },
  })

  if (!user?.email) {
    return { status: 'not_found' }
  }

  return {
    status: 'eligible',
    email: user.email,
    name: user.name,
  }
}

export function toPublicUser(user: StoredUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}

/** Permanently delete a user and all related data (cascades via Prisma). */
export async function deleteUserAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  if (user.email) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email.trim().toLowerCase() },
    })
  }

  await prisma.user.delete({ where: { id: userId } })
}
