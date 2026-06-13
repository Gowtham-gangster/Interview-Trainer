import type { Prisma } from '@prisma/client'

import type { ResumeDocument } from '@/lib/api/types/resume-api'
import type { ParsedResumeData } from '@/types/resume'
import { prisma } from '@/lib/db/prisma'

function toJsonValue(
  value: ParsedResumeData | undefined
): Prisma.InputJsonValue | undefined {
  if (!value) return undefined
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function toResumeDocument(record: {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  status: string
  uploadedAt: Date
  updatedAt: Date
  orchestrateThreadId: string | null
  sessionId: string | null
  rawText: string | null
  parsedData: unknown
  error: string | null
}): ResumeDocument {
  return {
    id: record.id,
    file_name: record.fileName,
    file_size: record.fileSize,
    mime_type: record.mimeType,
    status: record.status as ResumeDocument['status'],
    uploaded_at: record.uploadedAt.toISOString(),
    updated_at: record.updatedAt.toISOString(),
    thread_id: record.orchestrateThreadId ?? undefined,
    session_id: record.sessionId ?? undefined,
    raw_text: record.rawText ?? undefined,
    parsed: (record.parsedData as ParsedResumeData | null) ?? undefined,
    error: record.error ?? undefined,
  }
}

export async function saveResume(
  document: ResumeDocument,
  userId?: string
): Promise<ResumeDocument> {
  const record = await prisma.resume.upsert({
    where: { id: document.id },
    update: {
      fileName: document.file_name,
      fileSize: document.file_size,
      mimeType: document.mime_type,
      status: document.status,
      orchestrateThreadId: document.thread_id,
      sessionId: document.session_id,
      rawText: document.raw_text,
      parsedData: toJsonValue(document.parsed),
      error: document.error,
      userId,
    },
    create: {
      id: document.id,
      userId,
      fileName: document.file_name,
      fileSize: document.file_size,
      mimeType: document.mime_type,
      status: document.status,
      orchestrateThreadId: document.thread_id,
      sessionId: document.session_id,
      rawText: document.raw_text,
      parsedData: toJsonValue(document.parsed),
      error: document.error,
    },
  })

  return toResumeDocument(record)
}

export async function getResume(
  resumeId: string
): Promise<ResumeDocument | undefined> {
  const record = await prisma.resume.findUnique({ where: { id: resumeId } })
  return record ? toResumeDocument(record) : undefined
}

export async function getResumeForUser(
  resumeId: string,
  userId: string
): Promise<ResumeDocument | undefined> {
  const record = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  })
  return record ? toResumeDocument(record) : undefined
}

export async function listResumes(userId?: string): Promise<ResumeDocument[]> {
  const records = await prisma.resume.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { uploadedAt: 'desc' },
  })

  return records.map(toResumeDocument)
}

export async function deleteResume(resumeId: string): Promise<boolean> {
  try {
    await prisma.resume.delete({ where: { id: resumeId } })
    return true
  } catch {
    return false
  }
}

export async function deleteResumeForUser(
  resumeId: string,
  userId: string
): Promise<boolean> {
  try {
    const result = await prisma.resume.deleteMany({
      where: { id: resumeId, userId },
    })
    return result.count > 0
  } catch {
    return false
  }
}
