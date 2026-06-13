import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getAuthUser } from '@/lib/auth/session'
import { completeUserOnboarding } from '@/lib/db/user-data-repository'

export const runtime = 'nodejs'

const onboardingSchema = z.object({
  targetRole: z.string().trim().min(2, 'Target role is required'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  skills: z.array(z.string().trim().min(1)).min(1, 'Add at least one skill'),
})

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = onboardingSchema.parse(await request.json())
    const data = await completeUserOnboarding(user.id, body)

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message ?? 'Invalid onboarding data' },
        { status: 400 }
      )
    }

    const message =
      error instanceof Error ? error.message : 'Failed to complete onboarding'

    return NextResponse.json({ message }, { status: 500 })
  }
}
