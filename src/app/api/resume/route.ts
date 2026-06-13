import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { listResumes } from '@/lib/server/resume-store'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getAuthUser()
  const resumes = await listResumes(user?.id)
  return NextResponse.json(resumes)
}
