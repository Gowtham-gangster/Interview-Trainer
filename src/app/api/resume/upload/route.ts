import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/server/rate-limit'
import { parseResumeText } from '@/lib/server/resume-parser'
import { saveResume } from '@/lib/server/resume-store'
import {
  extractResumeText,
  isAcceptedResumeFile,
} from '@/lib/server/resume-text'
import { generateId } from '@/lib/utils'
import type { ResumeDocument } from '@/lib/api/types/resume-api'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: Request) {
  const user = await getAuthUser()
  const rateLimited = await enforceRateLimit(
    request,
    'upload',
    user?.id
  )
  if (rateLimited) return rateLimited

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'Resume file is required' },
        { status: 400 }
      )
    }

    if (!isAcceptedResumeFile(file)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unsupported file type. Upload a PDF or TXT resume.',
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 5MB.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractResumeText(file, buffer)
    const parsed = parseResumeText(text)

    const document: ResumeDocument = {
      id: generateId(),
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      status: 'parsed',
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      thread_id: formData.get('thread_id')?.toString(),
      session_id: formData.get('session_id')?.toString(),
      parsed,
      raw_text: text,
    }

    await saveResume(document, user?.id)

    return NextResponse.json(document)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Resume upload failed'

    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
