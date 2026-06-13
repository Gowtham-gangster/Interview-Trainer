export type ResumeUploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

export interface ResumeExperience {
  id: string
  title: string
  company: string
  period: string
  location?: string
  description: string
  highlights: string[]
}

export interface ResumeEducation {
  id: string
  degree: string
  institution: string
  period: string
  gpa?: string
  honors?: string
}

export interface ResumeProject {
  id: string
  name: string
  description: string
  technologies: string[]
  link?: string
  period?: string
}

export interface ParsedResumeData {
  skills: string[]
  experience: ResumeExperience[]
  education: ResumeEducation[]
  projects: ResumeProject[]
}

export interface ResumeUploadRecord {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: Date
  status: ResumeUploadStatus
  progress: number
  parsed?: ParsedResumeData
  error?: string
}
