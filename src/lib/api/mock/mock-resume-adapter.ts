import type {
  ResumeAnalysisResult,
  ResumeDocument,
  ResumeListParams,
  ResumeUploadOptions,
} from '@/lib/api/types/resume-api'
import {
  MOCK_PARSED_RESUME,
  MOCK_RESUMES,
  delay,
  mockId,
  nextResumeId,
} from '@/lib/api/mock/watsonx-mock-data'

const resumes = [...MOCK_RESUMES]

export const mockResumeAdapter = {
  async upload(options: ResumeUploadOptions): Promise<ResumeDocument> {
    const { file, onProgress, thread_id, session_id } = options

    for (let p = 0; p <= 100; p += 20) {
      await delay(120)
      onProgress?.(p)
    }

    const doc: ResumeDocument = {
      id: nextResumeId(),
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      status: 'processing',
      uploaded_at: new Date().toISOString(),
      thread_id,
      session_id,
    }
    resumes.unshift(doc)

    await delay(800)
    doc.status = 'parsed'
    doc.updated_at = new Date().toISOString()
    doc.parsed = MOCK_PARSED_RESUME
    doc.raw_text = [
      'Software Engineer',
      'Skills: TypeScript, React, Node.js, System Design, AWS',
      'Experience: Software Engineer at Acme Corp (2022 — Present)',
      'Education: B.Tech Computer Science, State University (2018 — 2022)',
      'Projects: AI Interview Trainer — Mock interview platform with watsonx Orchestrate.',
    ].join('\n')

    return doc
  },

  async list(params?: ResumeListParams): Promise<ResumeDocument[]> {
    await delay(250)
    let result = [...resumes]
    if (params?.thread_id) {
      result = result.filter((r) => r.thread_id === params.thread_id)
    }
    const offset = params?.offset ?? 0
    const limit = params?.limit ?? 20
    return result.slice(offset, offset + limit)
  },

  async get(resumeId: string): Promise<ResumeDocument> {
    await delay(200)
    const doc = resumes.find((r) => r.id === resumeId)
    if (!doc) throw new Error(`Resume not found: ${resumeId}`)
    return doc
  },

  async getStatus(resumeId: string): Promise<Pick<ResumeDocument, 'id' | 'status' | 'error'>> {
    await delay(150)
    const doc = await mockResumeAdapter.get(resumeId)
    return { id: doc.id, status: doc.status, error: doc.error }
  },

  async delete(resumeId: string): Promise<void> {
    await delay(200)
    const index = resumes.findIndex((r) => r.id === resumeId)
    if (index !== -1) resumes.splice(index, 1)
  },

  async analyze(resumeId: string): Promise<ResumeAnalysisResult> {
    await delay(900)
    const doc = await mockResumeAdapter.get(resumeId)
    return {
      id: mockId('analysis'),
      resume_id: doc.id,
      summary:
        'Strong full-stack profile with solid React and system design fundamentals. Ready for mid-to-senior SWE interviews.',
      skills: doc.parsed?.skills ?? [],
      match_score: 82,
      strengths: [
        'Relevant modern stack (TypeScript, React, Node.js)',
        'Demonstrated ownership on platform migration',
      ],
      gaps: [
        'Add more quantified impact metrics',
        'Include distributed systems project details',
      ],
      recommendations: [
        'Prepare 2 STAR stories for leadership scenarios',
        'Practice system design for high-traffic APIs',
      ],
      generated_at: new Date().toISOString(),
    }
  },
}
