export type ExperienceLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert'

export interface UserProfile {
  name: string
  email: string
  avatar?: string
  experienceLevel: ExperienceLevel
  skills: string[]
  targetRole: string
}

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner (0–1 years)',
  intermediate: 'Intermediate (2–4 years)',
  advanced: 'Advanced (5–8 years)',
  expert: 'Expert (8+ years)',
}
