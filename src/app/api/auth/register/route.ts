import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { createEmailVerificationToken } from '@/lib/auth/email-verification'
import { parseRegistrationEmail } from '@/lib/auth/registration-email'
import {
  createUser,
  getEmailRegistrationConflict,
  toPublicUser,
} from '@/lib/auth/user-store'
import { getAppBaseUrl } from '@/lib/email/config'
import {
  isEmailConfigured,
  sendEmailVerificationSafe,
  sendWelcomeEmailSafe,
} from '@/lib/email/mailer'
import { enforceRateLimit } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

function registrationErrorStatus(message: string): number {
  if (
    message.includes('already exists') ||
    message.includes('already registered') ||
    message.includes('Sign up with Google')
  ) {
    return 409
  }

  if (message.includes('valid email')) {
    return 400
  }

  return 500
}

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'auth')
  if (rateLimited) return rateLimited

  try {
    const body = (await request.json()) as {
      name?: string
      email?: string
      password?: string
    }

    const { name, email, password } = body

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    const parsedEmail = parseRegistrationEmail(email)
    if (!parsedEmail.ok) {
      return NextResponse.json(
        { success: false, message: parsedEmail.message },
        { status: 400 }
      )
    }

    const conflict = await getEmailRegistrationConflict(parsedEmail.email)
    if (conflict) {
      return NextResponse.json(
        { success: false, message: conflict.message, reason: conflict.type },
        { status: 409 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const requiresEmailVerification = isEmailConfigured()
    const user = await createUser(name, parsedEmail.email, password, {
      requireEmailVerification: requiresEmailVerification,
    })

    if (requiresEmailVerification) {
      const token = await createEmailVerificationToken(user.email)
      await sendEmailVerificationSafe({
        to: user.email,
        userName: user.name,
        verifyUrl: `${getAppBaseUrl()}/api/auth/verify-email?token=${token}`,
      })
    } else {
      void sendWelcomeEmailSafe({
        to: user.email,
        userName: user.name,
        loginUrl: `${getAppBaseUrl()}/auth/complete`,
      })
    }

    return NextResponse.json({
      success: true,
      requiresEmailVerification,
      data: toPublicUser(user),
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'An account with this email already exists. Please sign in instead.',
          reason: 'taken',
        },
        { status: 409 }
      )
    }

    const message =
      error instanceof Error ? error.message : 'Registration failed'

    return NextResponse.json(
      { success: false, message },
      { status: registrationErrorStatus(message) }
    )
  }
}
