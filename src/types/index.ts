export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface InterviewSession {
  id: string
  userId: string
  title: string
  jobRole: string
  company?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  type: 'technical' | 'behavioral' | 'mixed'
  status: 'active' | 'completed' | 'paused'
  duration: number // in minutes
  startedAt: Date
  endedAt?: Date
  messages: Message[]
  feedback?: InterviewFeedback
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  questionType?: 'technical' | 'behavioral' | 'situational'
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
  feedback?: string
  score?: number
}

export interface InterviewFeedback {
  id: string
  sessionId: string
  overallScore: number
  technicalScore?: number
  communicationScore: number
  problemSolvingScore: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  detailedAnalysis: FeedbackCategory[]
  createdAt: Date
}

export interface FeedbackCategory {
  category: string
  score: number
  feedback: string
  examples: string[]
}

export interface Interview {
  id: string
  userId: string
  title: string
  description: string
  jobRole: string
  company?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  type: 'technical' | 'behavioral' | 'mixed'
  estimatedDuration: number
  questions: InterviewQuestion[]
  tags: string[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface InterviewQuestion {
  id: string
  question: string
  type: 'technical' | 'behavioral' | 'situational'
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  expectedAnswer?: string
  hints?: string[]
  followUpQuestions?: string[]
}

export interface InterviewAnalytics {
  totalSessions: number
  totalDuration: number
  averageScore: number
  improvementTrend: number
  categoryScores: CategoryScore[]
  recentSessions: InterviewSession[]
  achievements: Achievement[]
}

export interface CategoryScore {
  category: string
  score: number
  trend: number
  sessionsCount: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: Date
  progress: number
  target: number
}

export interface ApiResponse<T = any> {
  data: T
  message: string
  success: boolean
  error?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateInterviewRequest {
  title: string
  jobRole: string
  company?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  type: 'technical' | 'behavioral' | 'mixed'
  estimatedDuration: number
}

export interface SendMessageRequest {
  sessionId: string
  content: string
  metadata?: Partial<MessageMetadata>
}

export interface StreamResponse {
  type: 'message' | 'typing' | 'feedback' | 'error'
  data: any
  timestamp: Date
}

// Theme types — persisted via next-themes (see src/lib/theme)
export type Theme = 'light' | 'dark'

// Store types
export interface AppState {
  sidebarOpen: boolean
  currentUser: User | null
}

export interface ChatState {
  currentSession: InterviewSession | null
  messages: Message[]
  isLoading: boolean
  isTyping: boolean
  error: string | null
}

export interface InterviewState {
  sessions: InterviewSession[]
  currentInterview: Interview | null
  analytics: InterviewAnalytics | null
  isLoading: boolean
  error: string | null
}

// Component props types
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface InterviewConfigFormData {
  title: string
  jobRole: string
  company?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  type: 'technical' | 'behavioral' | 'mixed'
  estimatedDuration: number
}

// API Error types
export interface ApiError {
  message: string
  status: number
  code?: string
  details?: Record<string, any>
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}