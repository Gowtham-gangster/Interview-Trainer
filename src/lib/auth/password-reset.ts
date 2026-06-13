import { randomBytes } from 'crypto'

import { prisma } from '@/lib/db/prisma'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function createPasswordResetToken(email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase()
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS)

  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  })

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token,
      expires,
    },
  })

  return token
}

export async function verifyPasswordResetToken(
  token: string,
): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { token } })
    }
    return null
  }

  return record.identifier
}

export async function consumePasswordResetToken(token: string): Promise<void> {
  await prisma.verificationToken.deleteMany({ where: { token } })
}
