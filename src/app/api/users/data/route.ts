import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import {
  getOrCreateUserAppData,
  resetUserAppData,
  updateUserProfile,
  updateUserSettings,
} from '@/lib/db/user-data-repository'
import type { AppSettings } from '@/lib/data/app-storage'
import type { UserProfile } from '@/types/profile'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const data = await getOrCreateUserAppData(user.id, user.name, user.email)
    return NextResponse.json(data)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load user data'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      profile?: UserProfile
      settings?: AppSettings
      reset?: boolean
      currentPassword?: string
    }

    if (body.reset) {
      const data = await resetUserAppData(user.id, user.name, user.email)
      return NextResponse.json(data)
    }

    if (body.profile) {
      const data = await updateUserProfile(user.id, body.profile, {
        currentPassword: body.currentPassword,
      })
      return NextResponse.json(data)
    }

    if (body.settings) {
      const data = await updateUserSettings(user.id, body.settings)
      return NextResponse.json(data)
    }

    return NextResponse.json(
      { message: 'No profile or settings provided' },
      { status: 400 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update user data'
    return NextResponse.json({ message }, { status: 500 })
  }
}
