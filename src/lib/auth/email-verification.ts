import { randomBytes } from 'crypto'

import { prisma } from '@/lib/db/prisma'

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const POST_VERIFY_LOGIN_TTL_MS = 15 * 60 * 1000 // 15 minutes
const VERIFY_IDENTIFIER_PREFIX = 'email-verify:'
const EMAIL_CHANGE_PREFIX = 'email-change:'
const POST_VERIFY_LOGIN_PREFIX = 'post-verify-login:'

export function emailVerificationIdentifier(email: string): string {
  return `${VERIFY_IDENTIFIER_PREFIX}${email.trim().toLowerCase()}`
}

export function emailChangeIdentifier(userId: string, newEmail: string): string {
  return `${EMAIL_CHANGE_PREFIX}${userId}:${newEmail.trim().toLowerCase()}`
}

export function parseEmailChangeIdentifier(
  identifier: string
): { userId: string; newEmail: string } | null {
  if (!identifier.startsWith(EMAIL_CHANGE_PREFIX)) return null

  const rest = identifier.slice(EMAIL_CHANGE_PREFIX.length)
  const separatorIndex = rest.indexOf(':')
  if (separatorIndex <= 0) return null

  const userId = rest.slice(0, separatorIndex)
  const newEmail = rest.slice(separatorIndex + 1)

  if (!userId || !newEmail) return null

  return { userId, newEmail }
}

async function createVerificationToken(
  identifier: string,
  ttlMs: number = VERIFY_TOKEN_TTL_MS
): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + ttlMs)

  await prisma.verificationToken.deleteMany({
    where: { identifier },
  })

  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  })

  return token
}

export async function createEmailVerificationToken(
  email: string
): Promise<string> {
  return createVerificationToken(emailVerificationIdentifier(email))
}

export async function createEmailChangeToken(
  userId: string,
  newEmail: string
): Promise<string> {
  return createVerificationToken(emailChangeIdentifier(userId, newEmail))
}

export function postVerificationLoginIdentifier(userId: string): string {
  return `${POST_VERIFY_LOGIN_PREFIX}${userId}`
}

export async function createPostVerificationLoginToken(
  userId: string
): Promise<string> {
  return createVerificationToken(
    postVerificationLoginIdentifier(userId),
    POST_VERIFY_LOGIN_TTL_MS
  )
}

export async function consumePostVerificationLoginToken(
  token: string
): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record || !record.identifier.startsWith(POST_VERIFY_LOGIN_PREFIX)) {
    return null
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    return null
  }

  await prisma.verificationToken.delete({ where: { token } })

  const userId = record.identifier.slice(POST_VERIFY_LOGIN_PREFIX.length)
  return userId || null
}

export async function getPendingEmailChange(
  userId: string
): Promise<string | null> {
  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: { startsWith: `${EMAIL_CHANGE_PREFIX}${userId}:` },
      expires: { gt: new Date() },
    },
    orderBy: { expires: 'desc' },
  })

  if (!record) return null

  return parseEmailChangeIdentifier(record.identifier)?.newEmail ?? null
}

export async function verifyEmailVerificationToken(
  token: string
): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record) return null

  // Email-change tokens are validated separately — do not delete them here.
  if (!record.identifier.startsWith(VERIFY_IDENTIFIER_PREFIX)) {
    return null
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    return null
  }

  return record.identifier.slice(VERIFY_IDENTIFIER_PREFIX.length)
}

export async function peekEmailChangeToken(
  token: string
): Promise<{ userId: string; newEmail: string } | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record) return null

  if (!record.identifier.startsWith(EMAIL_CHANGE_PREFIX)) {
    return null
  }

  if (record.expires < new Date()) {
    return null
  }

  return parseEmailChangeIdentifier(record.identifier)
}

export async function verifyEmailChangeToken(
  token: string
): Promise<{ userId: string; newEmail: string } | null> {
  const change = await peekEmailChangeToken(token)

  if (!change) {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (
      record?.identifier.startsWith(EMAIL_CHANGE_PREFIX) &&
      record.expires < new Date()
    ) {
      await prisma.verificationToken.delete({ where: { token } })
    }

    return null
  }

  return change
}

export async function consumeEmailVerificationToken(token: string): Promise<void> {
  await prisma.verificationToken.deleteMany({ where: { token } })
}
