import { NextResponse } from 'next/server'

import { parseRegistrationEmail } from '@/lib/auth/registration-email'
import { getEmailChangeConflict } from '@/lib/auth/user-store'
import { getAuthUser } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const rateLimited = await enforceRateLimit(request, 'authEmailCheck', user.id)
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

    if (parsed.email === user.email?.trim().toLowerCase()) {
      return NextResponse.json({
        available: true,
        email: parsed.email,
      })
    }

    const conflict = await getEmailChangeConflict(parsed.email, user.id)

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
