import type { ParsedResumeData } from '@/types/resume'

export type ResumeProcessingStatus =
  | 'uploaded'
  | 'processing'
  | 'parsed'
  | 'failed'

export interface ResumeDocument {
  id: string
  file_name: string
  file_size: number
  mime_type: string
  status: ResumeProcessingStatus
  uploaded_at: string
  updated_at?: string
  thread_id?: string
  session_id?: string
  parsed?: ParsedResumeData
  raw_text?: string
  error?: string
}

export interface ResumeUploadOptions {
  file: File
  thread_id?: string
  session_id?: string
  onProgress?: (progress: number) => void
}

export interface ResumeAnalysisResult {
  id: string
  resume_id: string
  summary: string
  skills: string[]
  match_score?: number
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  generated_at: string
}

export interface ResumeListParams {
  limit?: number
  offset?: number
  thread_id?: string
}
