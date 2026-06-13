import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const ACCEPTED_EXTENSIONS = new Set(['.pdf', '.txt', '.doc', '.docx'])

type PdfParseFn = (
  buffer: Buffer
) => Promise<{ text?: string }>

let pdfParseFn: PdfParseFn | null = null

function getPdfParser(): PdfParseFn {
  if (!pdfParseFn) {
    pdfParseFn = require('pdf-parse') as PdfParseFn
  }
  return pdfParseFn
}

export function isAcceptedResumeFile(file: File): boolean {
  const name = file.name.toLowerCase()
  const extension = name.includes('.') ? `.${name.split('.').pop()}` : ''

  if (file.type && ACCEPTED_MIME_TYPES.has(file.type)) return true
  return ACCEPTED_EXTENSIONS.has(extension)
}

export async function extractResumeText(
  file: File,
  buffer: Buffer
): Promise<string> {
  const name = file.name.toLowerCase()
  const mime = file.type

  if (mime === 'text/plain' || name.endsWith('.txt')) {
    return buffer.toString('utf8').trim()
  }

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    try {
      const parsed = await getPdfParser()(buffer)
      const text = (parsed.text ?? '').trim()
      if (text) return text
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'PDF parsing failed'
      throw new Error(
        `Could not read this PDF (${detail}). Try a text-based PDF or upload a .txt copy.`
      )
    }

    throw new Error(
      'Could not extract text from this PDF. Try a text-based PDF or upload a .txt copy.'
    )
  }

  if (
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    throw new Error(
      'DOCX parsing is not supported yet. Please upload a PDF or TXT resume.'
    )
  }

  if (mime === 'application/msword' || name.endsWith('.doc')) {
    throw new Error(
      'DOC parsing is not supported yet. Please upload a PDF or TXT resume.'
    )
  }

  throw new Error('Unsupported file type. Upload a PDF or TXT resume.')
}
