import { generateId } from '@/lib/utils'
import type { ParsedResumeData } from '@/types/resume'

function sectionText(text: string, labels: string[]): string {
  const pattern = new RegExp(
    `(?:^|\\n)\\s*(?:${labels.join('|')})\\s*[:\\-]?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:[A-Z][A-Za-z /&]+)\\s*[:\\-]?\\s*\\n|$)`,
    'i'
  )
  const match = text.match(pattern)
  return match?.[1]?.trim() ?? ''
}

function splitLines(block: string): string[] {
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseSkills(text: string): string[] {
  const block =
    sectionText(text, [
      'Skills',
      'Technical Skills',
      'Core Skills',
      'Key Skills',
      'Technologies',
    ]) || text

  const candidates = block
    .split(/[\n,•|/]/)
    .map((item) => item.replace(/^[-*•]\s*/, '').trim())
    .filter((item) => item.length > 1 && item.length < 40)

  const unique = [...new Set(candidates)]
  return unique.slice(0, 20)
}

function parseExperience(text: string): ParsedResumeData['experience'] {
  const block = sectionText(text, [
    'Experience',
    'Work Experience',
    'Professional Experience',
    'Employment',
  ])
  if (!block) return []

  const chunks = block.split(/\n{2,}/).filter(Boolean)
  return chunks.slice(0, 6).map((chunk) => {
    const lines = splitLines(chunk)
    const titleLine = lines[0] ?? 'Role'
    const companyLine = lines[1] ?? 'Company'
    const periodMatch = chunk.match(
      /(20\d{2}[\s–—-]+(?:20\d{2}|Present|Current)|[A-Za-z]{3,9}\s+20\d{2}[\s–—-]+(?:[A-Za-z]{3,9}\s+20\d{2}|Present|Current))/i
    )

    return {
      id: generateId(),
      title: titleLine,
      company: companyLine,
      period: periodMatch?.[0] ?? 'Period not listed',
      description: lines.slice(2).join(' ').slice(0, 280) || chunk.slice(0, 280),
      highlights: lines
        .filter((line) => /^[-*•]/.test(line))
        .map((line) => line.replace(/^[-*•]\s*/, ''))
        .slice(0, 4),
    }
  })
}

function parseEducation(text: string): ParsedResumeData['education'] {
  const block = sectionText(text, ['Education', 'Academic Background'])
  if (!block) return []

  const chunks = block.split(/\n{2,}/).filter(Boolean)
  return chunks.slice(0, 4).map((chunk) => {
    const lines = splitLines(chunk)
    const periodMatch = chunk.match(/(20\d{2}[\s–—-]+20\d{2}|20\d{2}[\s–—-]+(?:Present|Current))/i)
    const gpaMatch = chunk.match(/(?:GPA|CGPA|Score)\s*[:.]?\s*([0-9.%/]+)/i)

    return {
      id: generateId(),
      degree: lines[0] ?? 'Degree',
      institution: lines[1] ?? 'Institution',
      period: periodMatch?.[0] ?? 'Period not listed',
      gpa: gpaMatch?.[1],
    }
  })
}

function parseProjects(text: string): ParsedResumeData['projects'] {
  const block = sectionText(text, ['Projects', 'Personal Projects', 'Academic Projects'])
  if (!block) return []

  const chunks = block.split(/\n{2,}/).filter(Boolean)
  return chunks.slice(0, 5).map((chunk) => {
    const lines = splitLines(chunk)
    const techMatch = chunk.match(/(?:Technolog(?:y|ies)|Stack|Tools)\s*[:.]?\s*(.+)$/im)

    return {
      id: generateId(),
      name: lines[0] ?? 'Project',
      description: lines.slice(1).join(' ').slice(0, 280) || chunk.slice(0, 280),
      technologies: techMatch
        ? techMatch[1]
            .split(/[,|/]/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 8)
        : [],
    }
  })
}

export function parseResumeText(text: string): ParsedResumeData {
  const normalized = text.replace(/\r\n/g, '\n').trim()

  if (!normalized) {
    throw new Error('Could not extract any text from the uploaded resume.')
  }

  const parsed: ParsedResumeData = {
    skills: parseSkills(normalized),
    experience: parseExperience(normalized),
    education: parseEducation(normalized),
    projects: parseProjects(normalized),
  }

  if (
    parsed.skills.length === 0 &&
    parsed.experience.length === 0 &&
    parsed.education.length === 0 &&
    parsed.projects.length === 0
  ) {
    const words = normalized
      .split(/[\s,•|/]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 2 && word.length < 24)

    parsed.skills = [...new Set(words)].slice(0, 12)
    parsed.experience = [
      {
        id: generateId(),
        title: 'Experience',
        company: 'See resume',
        period: 'Extracted from upload',
        description: normalized.slice(0, 500),
        highlights: [],
      },
    ]
  }

  return parsed
}
