import { NextResponse } from 'next/server'

import { requireApiUser } from '@/lib/server/api-auth'
import {
  deleteResumeForUser,
  getResumeForUser,
} from '@/lib/server/resume-store'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { user, error } = await requireApiUser()
  if (error) return error

  const { id } = await context.params
  const resume = await getResumeForUser(id, user.id)

  if (!resume) {
    return NextResponse.json(
      { success: false, message: 'Resume not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(resume)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user, error } = await requireApiUser()
  if (error) return error

  const { id } = await context.params
  const deleted = await deleteResumeForUser(id, user.id)

  if (!deleted) {
    return NextResponse.json(
      { success: false, message: 'Resume not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true })
}
