import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createPasswordResetToken } from '@/lib/auth/password-reset'
import { getPasswordResetEligibility } from '@/lib/auth/user-store'
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/email/mailer'
import { enforceRateLimit } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'auth')
  if (rateLimited) return rateLimited

  try {
    const body = forgotPasswordSchema.parse(await request.json())
    const email = body.email.toLowerCase()

    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password reset email is not configured. Contact the administrator.',
        },
        { status: 503 },
      )
    }

    const eligibility = await getPasswordResetEligibility(email)

    if (eligibility.status === 'not_found') {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter a valid registered email address.',
        },
        { status: 404 },
      )
    }

    const token = await createPasswordResetToken(eligibility.email)
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    await sendPasswordResetEmail({
      to: eligibility.email,
      resetUrl,
      userName: eligibility.name,
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your email.',
      email: eligibility.email,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.errors[0]?.message ?? 'Please enter a valid email address.',
        },
        { status: 400 },
      )
    }

    console.error('[forgot-password]', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send reset link. Please try again later.',
      },
      { status: 500 },
    )
  }
}
