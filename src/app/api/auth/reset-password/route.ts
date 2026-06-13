import { NextResponse } from 'next/server'

import {
  consumePasswordResetToken,
  verifyPasswordResetToken,
} from '@/lib/auth/password-reset'
import { updateUserPassword } from '@/lib/auth/user-store'
import { enforceRateLimit } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'authReset')
  if (rateLimited) return rateLimited

  try {
    const body = (await request.json()) as {
      token?: string
      password?: string
    }

    const token = body.token?.trim()
    const password = body.password

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token and password are required' },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 },
      )
    }

    const email = await verifyPasswordResetToken(token)
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset link' },
        { status: 400 },
      )
    }

    const updated = await updateUserPassword(email, password)
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 },
      )
    }

    await consumePasswordResetToken(token)

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    })
  } catch (error) {
    console.error('[reset-password]', error)
    return NextResponse.json(
      { success: false, message: 'Failed to reset password' },
      { status: 500 },
    )
  }
}
