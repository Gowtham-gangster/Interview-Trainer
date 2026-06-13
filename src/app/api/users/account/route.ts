import { NextResponse } from 'next/server'

import { deleteUserAccount } from '@/lib/auth/user-store'
import { getAuthUser } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const rateLimited = await enforceRateLimit(request, 'auth', user.id)
    if (rateLimited) return rateLimited

    await deleteUserAccount(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete account'
    return NextResponse.json({ message }, { status: 500 })
  }
}
