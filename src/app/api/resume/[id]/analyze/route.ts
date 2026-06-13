import { NextResponse } from 'next/server'

import type { ResumeAnalysisResult } from '@/lib/api/types/resume-api'
import { requireApiUser } from '@/lib/server/api-auth'
import { enforceRateLimit } from '@/lib/server/rate-limit'
import { getResumeForUser } from '@/lib/server/resume-store'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const { user, error } = await requireApiUser()
  if (error) return error

  const rateLimited = await enforceRateLimit(request, 'upload', user.id)
  if (rateLimited) return rateLimited

  const { id } = await context.params
  const resume = await getResumeForUser(id, user.id)

  if (!resume) {
    return NextResponse.json(
      { success: false, message: 'Resume not found' },
      { status: 404 }
    )
  }

  const skills = resume.parsed?.skills ?? []
  const experienceCount = resume.parsed?.experience.length ?? 0

  const result: ResumeAnalysisResult = {
    id: `analysis_${id}`,
    resume_id: id,
    summary:
      experienceCount > 0
        ? `Resume includes ${experienceCount} experience section(s) and ${skills.length} extracted skills. Ready for interview personalization.`
        : 'Resume uploaded successfully. Add more structured sections to improve parsing quality.',
    skills,
    match_score: Math.min(95, 55 + skills.length * 2 + experienceCount * 5),
    strengths: skills.slice(0, 3).map((skill) => `Strong signal for ${skill}`),
    gaps:
      skills.length < 5
        ? ['Add a dedicated skills section with comma-separated technologies']
        : ['Quantify impact with metrics in experience bullets'],
    recommendations: [
      'Practice explaining your top 3 projects in STAR format',
      'Align resume keywords with your target job description',
    ],
    generated_at: new Date().toISOString(),
  }

  return NextResponse.json(result)
}
