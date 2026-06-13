import { NextResponse } from 'next/server'

import { requireApiUser } from '@/lib/server/api-auth'
import { getVoiceServiceStatus } from '@/lib/server/watson-speech'

export async function GET() {
  const { error } = await requireApiUser()
  if (error) return error

  const status = await getVoiceServiceStatus()
  return NextResponse.json(status)
}
