import type { Conversation } from '@/lib/api/types/conversation'
import type { ResumeDocument } from '@/lib/api/types/resume-api'
import type { VoiceSession } from '@/lib/api/types/voice-api'
import type { WatsonxMessage, WatsonxThread } from '@/lib/api/types/watsonx'
import type { ParsedResumeData } from '@/types/resume'

const now = () => new Date().toISOString()

export const MOCK_THREADS: WatsonxThread[] = [
  {
    id: 'thread_mock_1',
    title: 'Technical Interview — SWE',
    status: 'active',
    assistant_id: 'assistant_interview',
    created_at: now(),
    updated_at: now(),
    metadata: { type: 'technical' },
  },
  {
    id: 'thread_mock_2',
    title: 'HR Behavioral Round',
    status: 'active',
    assistant_id: 'assistant_interview',
    created_at: now(),
    updated_at: now(),
    metadata: { type: 'behavioral' },
  },
]

export const MOCK_MESSAGES: Record<string, WatsonxMessage[]> = {
  thread_mock_1: [
    {
      id: 'msg_1',
      thread_id: 'thread_mock_1',
      role: 'assistant',
      content:
        "Welcome! I'll conduct a technical interview for a Software Engineer role. Let's start — can you explain the difference between `let`, `const`, and `var` in JavaScript?",
      created_at: now(),
    },
  ],
  thread_mock_2: [
    {
      id: 'msg_2',
      thread_id: 'thread_mock_2',
      role: 'assistant',
      content:
        "Let's practice HR questions. Tell me about a time you handled a conflict within your team.",
      created_at: now(),
    },
  ],
}

export const MOCK_PARSED_RESUME: ParsedResumeData = {
  skills: ['TypeScript', 'React', 'Node.js', 'System Design', 'AWS'],
  experience: [
    {
      id: 'exp_1',
      title: 'Software Engineer',
      company: 'Acme Corp',
      period: '2022 — Present',
      description: 'Full-stack development on interview training platform.',
      highlights: ['Led migration to Next.js', 'Reduced API latency by 40%'],
    },
  ],
  education: [
    {
      id: 'edu_1',
      degree: 'B.Tech Computer Science',
      institution: 'State University',
      period: '2018 — 2022',
      gpa: '8.6',
    },
  ],
  projects: [
    {
      id: 'proj_1',
      name: 'AI Interview Trainer',
      description: 'Mock interview platform with watsonx Orchestrate.',
      technologies: ['Next.js', 'TypeScript', 'IBM watsonx'],
    },
  ],
}

export const MOCK_RESUMES: ResumeDocument[] = [
  {
    id: 'resume_mock_1',
    file_name: 'john_doe_resume.pdf',
    file_size: 245_760,
    mime_type: 'application/pdf',
    status: 'parsed',
    uploaded_at: now(),
    updated_at: now(),
    thread_id: 'thread_mock_1',
    parsed: MOCK_PARSED_RESUME,
  },
]

export const MOCK_VOICE_SESSIONS: VoiceSession[] = []

let threadCounter = MOCK_THREADS.length
let messageCounter = 10
let resumeCounter = MOCK_RESUMES.length
let voiceSessionCounter = 0

export function mockId(prefix: string): string {
  return `${prefix}_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function nextThreadId(): string {
  threadCounter += 1
  return `thread_mock_${threadCounter}`
}

export function nextMessageId(): string {
  messageCounter += 1
  return `msg_${messageCounter}`
}

export function nextResumeId(): string {
  resumeCounter += 1
  return `resume_mock_${resumeCounter}`
}

export function nextVoiceSessionId(): string {
  voiceSessionCounter += 1
  return `voice_session_mock_${voiceSessionCounter}`
}

export function toConversation(thread: WatsonxThread): Conversation {
  const messages = MOCK_MESSAGES[thread.id] ?? []
  const last = messages[messages.length - 1]
  return {
    ...thread,
    type: (thread.metadata?.type as Conversation['type']) ?? 'mixed',
    message_count: messages.length,
    last_message_preview: last?.content?.slice(0, 120),
    last_message_at: last?.created_at ?? thread.updated_at,
  }
}

export function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
