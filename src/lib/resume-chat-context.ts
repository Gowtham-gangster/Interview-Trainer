import type { ParsedResumeData } from '@/types/resume'

const MAX_RESUME_CHARS = 14_000

export function formatResumeForAgent(params: {
  userMessage: string
  fileName: string
  rawText: string
  parsed?: ParsedResumeData
}): string {
  const { userMessage, fileName, rawText, parsed } = params
  const lines: string[] = [userMessage.trim(), '', `=== RESUME FILE: ${fileName} ===`, '']

  if (parsed?.skills.length) {
    lines.push(`Skills: ${parsed.skills.join(', ')}`, '')
  }

  if (parsed?.experience.length) {
    lines.push('Experience:')
    for (const item of parsed.experience.slice(0, 6)) {
      lines.push(
        `- ${item.title} at ${item.company} (${item.period})`,
        item.description
      )
    }
    lines.push('')
  }

  if (parsed?.education.length) {
    lines.push('Education:')
    for (const item of parsed.education.slice(0, 4)) {
      lines.push(`- ${item.degree}, ${item.institution} (${item.period})`)
    }
    lines.push('')
  }

  const body = rawText.trim()
  if (body) {
    const truncated = body.length > MAX_RESUME_CHARS
    const text = truncated ? body.slice(0, MAX_RESUME_CHARS) : body
    lines.push('--- Full resume text ---', text)
    if (truncated) {
      lines.push('', '[Resume text truncated for length]')
    }
  }

  lines.push(
    '',
    'Please analyze this resume according to the user request above. Do not ask the user to re-upload the file — the resume content is included in this message.'
  )

  return lines.join('\n').trim()
}
