import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'

export const MAX_CHAT_MESSAGE_LENGTH = 4000
export const MAX_TTS_TEXT_LENGTH = 5000

export async function requireApiUser() {
  const user = await getAuthUser()
  if (!user) {
    return {
      user: null as null,
      error: NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  return { user, error: null as null }
}

export function validateMessageLength(
  message: string,
  maxLength = MAX_CHAT_MESSAGE_LENGTH
) {
  if (message.length > maxLength) {
    return NextResponse.json(
      {
        success: false,
        message: `Message must be at most ${maxLength} characters`,
      },
      { status: 400 }
    )
  }

  return null
}
