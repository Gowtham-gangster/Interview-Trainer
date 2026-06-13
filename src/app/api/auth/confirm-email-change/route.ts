import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  consumeEmailVerificationToken,
  peekEmailChangeToken,
} from '@/lib/auth/email-verification'
import { getAuthUser } from '@/lib/auth/session'
import { changeUserEmail, verifyCurrentPassword } from '@/lib/auth/user-store'
import { enforceRateLimit } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

const confirmSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function GET(request: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const rateLimited = await enforceRateLimit(request, 'auth', user.id)
  if (rateLimited) return rateLimited

  const token = new URL(request.url).searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.json({ message: 'Token is required' }, { status: 400 })
  }

  const change = await peekEmailChangeToken(token)
  if (!change) {
    return NextResponse.json(
      { message: 'This verification link is invalid or has expired.' },
      { status: 400 }
    )
  }

  if (change.userId !== user.id) {
    return NextResponse.json(
      {
        message:
          'Sign in with the account that requested this email change to continue.',
      },
      { status: 403 }
    )
  }

  return NextResponse.json({
    newEmail: change.newEmail,
  })
}

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'auth')
  if (rateLimited) return rateLimited

  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = confirmSchema.parse(await request.json())
    const change = await peekEmailChangeToken(body.token)

    if (!change) {
      return NextResponse.json(
        { message: 'This verification link is invalid or has expired.' },
        { status: 400 }
      )
    }

    if (change.userId !== user.id) {
      return NextResponse.json(
        {
          message:
            'Sign in with the account that requested this email change to continue.',
        },
        { status: 403 }
      )
    }

    const passwordValid = await verifyCurrentPassword(user.id, body.password)
    if (!passwordValid) {
      return NextResponse.json(
        { message: 'Incorrect password. Please try again.' },
        { status: 401 }
      )
    }

    const changed = await changeUserEmail(change.userId, change.newEmail)
    if (!changed) {
      return NextResponse.json(
        { message: 'This email is no longer available.' },
        { status: 409 }
      )
    }

    await consumeEmailVerificationToken(body.token)

    return NextResponse.json({
      success: true,
      email: change.newEmail,
      message: 'Email address updated successfully.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? 'Invalid request' },
        { status: 400 }
      )
    }

    const message =
      error instanceof Error ? error.message : 'Failed to confirm email change'
    return NextResponse.json({ message }, { status: 500 })
  }
}
