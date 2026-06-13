import { NextResponse } from 'next/server'

import { parseRegistrationEmail } from '@/lib/auth/registration-email'
import { getEmailRegistrationConflict } from '@/lib/auth/user-store'
import { enforceRateLimit } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'authEmailCheck')
  if (rateLimited) return rateLimited

  try {
    const body = (await request.json()) as { email?: string }
    const parsed = parseRegistrationEmail(body.email ?? '')

    if (!parsed.ok) {
      return NextResponse.json({
        available: false,
        reason: 'invalid',
        message: parsed.message,
      })
    }

    const conflict = await getEmailRegistrationConflict(parsed.email)

    if (conflict) {
      return NextResponse.json({
        available: false,
        reason: conflict.type,
        message: conflict.message,
      })
    }

    return NextResponse.json({
      available: true,
      email: parsed.email,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to validate email'
    return NextResponse.json({ message }, { status: 500 })
  }
}
