import { NextResponse } from 'next/server'

import {
  consumeEmailVerificationToken,
  createPostVerificationLoginToken,
  peekEmailChangeToken,
  verifyEmailVerificationToken,
} from '@/lib/auth/email-verification'
import { parseRegistrationEmail } from '@/lib/auth/registration-email'
import { markEmailVerified } from '@/lib/auth/user-store'
import { getAppBaseUrl } from '@/lib/email/config'
import { isEmailConfigured, sendWelcomeEmailSafe } from '@/lib/email/mailer'
import { prisma } from '@/lib/db/prisma'
import { enforceRateLimit } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'auth')
  if (rateLimited) return rateLimited

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')?.trim()

  if (!token) {
    return NextResponse.redirect(
      new URL('/auth/verify-email?status=missing', getAppBaseUrl())
    )
  }

  const signupEmail = await verifyEmailVerificationToken(token)

  if (signupEmail) {
    const verified = await markEmailVerified(signupEmail)
    await consumeEmailVerificationToken(token)

    let successRedirect = '/auth/verify-email?status=success'

    if (verified) {
      const user = await prisma.user.findFirst({
        where: { email: signupEmail },
        select: { id: true, name: true, email: true },
      })

      if (user?.id) {
        const loginToken = await createPostVerificationLoginToken(user.id)
        successRedirect = `/auth/verify-email/complete?token=${encodeURIComponent(loginToken)}`
      }

      if (user?.email) {
        void sendWelcomeEmailSafe({
          to: user.email,
          userName: user.name,
          loginUrl: `${getAppBaseUrl()}/onboarding`,
        })
      }
    }

    return NextResponse.redirect(new URL(successRedirect, getAppBaseUrl()))
  }

  const emailChange = await peekEmailChangeToken(token)

  if (emailChange) {
    return NextResponse.redirect(
      new URL(
        `/auth/confirm-email-change?token=${encodeURIComponent(token)}`,
        getAppBaseUrl()
      )
    )
  }

  return NextResponse.redirect(
    new URL('/profile?emailChange=invalid', getAppBaseUrl())
  )
}

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'auth')
  if (rateLimited) return rateLimited

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { message: 'Email verification is not configured' },
      { status: 503 }
    )
  }

  try {
    const body = (await request.json()) as { email?: string }
    const parsed = parseRegistrationEmail(body.email ?? '')

    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { email: parsed.email },
      select: { email: true, name: true, emailVerified: true, passwordHash: true },
    })

    if (!user?.email || !user.passwordHash) {
      return NextResponse.json({
        success: true,
        message: 'If that account exists, a verification email has been sent.',
      })
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'This email is already verified. You can sign in.',
      })
    }

    const { createEmailVerificationToken } = await import(
      '@/lib/auth/email-verification'
    )
    const { sendEmailVerificationSafe } = await import('@/lib/email/mailer')

    const token = await createEmailVerificationToken(user.email)
    await sendEmailVerificationSafe({
      to: user.email,
      userName: user.name,
      verifyUrl: `${getAppBaseUrl()}/api/auth/verify-email?token=${token}`,
    })

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to resend verification email'
    return NextResponse.json({ message }, { status: 500 })
  }
}
