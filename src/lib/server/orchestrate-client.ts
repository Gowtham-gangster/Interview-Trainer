import { isValidUuid } from '@/lib/utils'

import { getIamAccessToken } from './watsonx-iam'
import { getWatsonxInstanceUrl } from './watsonx-env'

interface AgentEnvironment {
  id: string
  name?: string
  type?: string
}

interface AgentRecord {
  id: string
  name?: string
}

interface OrchestrateStreamEvent {
  event?: string
  object?: string
  data?: Record<string, unknown>
  choices?: Array<{
    delta?: {
      role?: string
      content?: string | unknown[]
    }
  }>
}

let cachedAgentConfig: {
  agentId: string
  environmentId: string
  environmentName?: string
  agentName?: string
} | null = null

let cachedEnvFingerprint: string | null = null

function getEnvFingerprint(): string {
  return [
    process.env.WATSONX_AGENT_ID?.trim() ?? '',
    process.env.WATSONX_AGENT_ENVIRONMENT_ID?.trim() ?? '',
    process.env.WATSONX_AGENT_ENVIRONMENT_NAME?.trim() ?? '',
  ].join('|')
}

/** Always route chat to the Interview Trainer agent */
const INTERVIEW_TRAINER_KEYWORDS = [
  'interview_trainer',
  'interview_trainer_agent',
]

async function orchestrateFetch(path: string, init?: RequestInit) {
  const accessToken = await getIamAccessToken()
  const instanceUrl = getWatsonxInstanceUrl()

  return fetch(`${instanceUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
}

function normalizeAgentName(name?: string): string {
  return (name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

function pickInterviewTrainerAgent(agents: AgentRecord[]): AgentRecord {
  const configuredId = process.env.WATSONX_AGENT_ID?.trim()
  if (configuredId) {
    const configured = agents.find((agent) => agent.id === configuredId)
    if (configured) return configured
    throw new Error(
      `Configured WATSONX_AGENT_ID not found: ${configuredId}`
    )
  }

  for (const keyword of INTERVIEW_TRAINER_KEYWORDS) {
    const match = agents.find((agent) =>
      normalizeAgentName(agent.name).includes(keyword)
    )
    if (match) return match
  }

  throw new Error(
    'Interview Trainer agent not found in this Orchestrate instance'
  )
}

function pickEnvironment(environments: AgentEnvironment[]): AgentEnvironment {
  const preferredName = (
    process.env.WATSONX_AGENT_ENVIRONMENT_NAME ?? 'draft'
  ).toLowerCase()
  const configuredId = process.env.WATSONX_AGENT_ENVIRONMENT_ID?.trim()

  const byName = environments.find(
    (env) => env.name?.toLowerCase() === preferredName
  )
  if (byName) {
    if (configuredId && configuredId !== byName.id) {
      console.warn(
        `[orchestrate] Using environment "${byName.name}" (${byName.id}); ` +
          `WATSONX_AGENT_ENVIRONMENT_ID points to a different environment.`
      )
    }
    return byName
  }

  if (configuredId) {
    const match = environments.find((env) => env.id === configuredId)
    if (match) return match
  }

  const byType = environments.find(
    (env) => env.type?.toLowerCase() === preferredName
  )
  if (byType) return byType

  return environments[0]
}

export async function resolveAgentConfig(_sessionType?: string): Promise<{
  agentId: string
  environmentId: string
  environmentName?: string
  agentName?: string
}> {
  const fingerprint = getEnvFingerprint()
  if (cachedAgentConfig && cachedEnvFingerprint === fingerprint) {
    return cachedAgentConfig
  }

  cachedEnvFingerprint = fingerprint
  cachedAgentConfig = null

  const agentsResponse = await orchestrateFetch('/v1/orchestrate/agents')
  if (!agentsResponse.ok) {
    throw new Error(`Failed to list agents (${agentsResponse.status})`)
  }

  const agents = (await agentsResponse.json()) as AgentRecord[]
  const agent = pickInterviewTrainerAgent(agents)
  if (!agent?.id) {
    throw new Error('No watsonx Orchestrate agents found in this instance')
  }

  const envResponse = await orchestrateFetch(
    `/v1/orchestrate/agents/${agent.id}/environment`
  )
  if (!envResponse.ok) {
    throw new Error(`Failed to load agent environment (${envResponse.status})`)
  }

  const environments = (await envResponse.json()) as AgentEnvironment[]
  const environment = pickEnvironment(environments)

  if (!environment?.id) {
    throw new Error('No agent environment available for chat')
  }

  const config = {
    agentId: agent.id,
    environmentId: environment.id,
    environmentName: environment.name,
    agentName: agent.name,
  }

  cachedAgentConfig = config
  return config
}

function extractTextFromContentArray(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((item) => {
      if (typeof item === 'string') return item
      if (!item || typeof item !== 'object') return ''

      const record = item as Record<string, unknown>
      if (typeof record.text === 'string') return record.text
      if (typeof record.value === 'string') return record.value
      if (typeof record.body === 'string') return record.body
      if (typeof record.markdown === 'string') return record.markdown
      if (record.response_type === 'text' && typeof record.text === 'string') {
        return record.text
      }
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

function extractAssistantTextFromMessage(message: unknown): string {
  if (!message || typeof message !== 'object') return ''

  const record = message as Record<string, unknown>
  if (record.role === 'user') return ''

  return extractTextFromContentArray(record.content).trim()
}

function shouldRenderMessage(message: unknown): boolean {
  if (!message || typeof message !== 'object') return true

  const record = message as Record<string, unknown>
  const additional = record.additional_properties
  if (!additional || typeof additional !== 'object') return true

  const props = additional as Record<string, unknown>
  const display = props.display_properties
  if (display && typeof display === 'object') {
    const displayProps = display as Record<string, unknown>
    if (displayProps.skip_render === true) return false
  }

  return true
}

function normalizeStreamEvent(parsed: OrchestrateStreamEvent): string | undefined {
  if (parsed.event) return parsed.event
  if (typeof parsed.object === 'string') {
    return parsed.object.replace(/^thread\./, '')
  }
  return undefined
}

function extractDeltaFromEvent(
  event: string | undefined,
  data: Record<string, unknown> | undefined,
  parsed: OrchestrateStreamEvent
): string {
  if (!event) return ''

  if (event === 'message.delta' && data) {
    const delta = data.delta
    if (delta && typeof delta === 'object') {
      const deltaRecord = delta as Record<string, unknown>
      if (typeof deltaRecord.text === 'string') return deltaRecord.text
      return extractTextFromContentArray(deltaRecord.content)
    }
  }

  if (event === 'run.step.delta' && data) {
    const stepDelta = data.delta
    if (stepDelta && typeof stepDelta === 'object') {
      const deltaRecord = stepDelta as Record<string, unknown>
      return extractTextFromContentArray(deltaRecord.content)
    }
  }

  const choiceDelta = parsed.choices?.[0]?.delta
  if (choiceDelta) {
    if (typeof choiceDelta.content === 'string') return choiceDelta.content
    return extractTextFromContentArray(choiceDelta.content)
  }

  return ''
}

function extractCreatedMessage(
  data: Record<string, unknown>
): { text: string; messageId?: string } {
  const message = data.message
  if (!message || typeof message !== 'object') {
    return { text: '' }
  }

  const record = message as Record<string, unknown>
  if (record.role !== 'assistant' || !shouldRenderMessage(message)) {
    return { text: '' }
  }

  const messageId =
    (typeof data.message_id === 'string' ? data.message_id : undefined) ||
    (typeof record.id === 'string' ? record.id : undefined)

  return {
    text: extractAssistantTextFromMessage(message),
    messageId,
  }
}

function getLlmParams():
  | {
      temperature: number
      top_p: number
      random_seed?: number
      max_new_tokens: number
    }
  | undefined {
  const rawTemp = process.env.WATSONX_LLM_TEMPERATURE?.trim()
  if (!rawTemp) return undefined

  const temperature = Number(rawTemp)
  if (Number.isNaN(temperature)) return undefined

  const rawSeed = process.env.WATSONX_LLM_RANDOM_SEED?.trim()
  const randomSeed = rawSeed ? Number(rawSeed) : 42

  return {
    temperature,
    top_p: 1,
    ...(Number.isNaN(randomSeed) ? {} : { random_seed: randomSeed }),
    max_new_tokens: 8192,
  }
}

function buildOrchestrateUserMessage(content: string) {
  return {
    role: 'user' as const,
    content: [
      {
        response_type: 'text' as const,
        text: content,
      },
    ],
    additional_properties: {
      wxa_message: {
        context: {
          skills: {
            conversational_skills: {
              session_variables: {
                chat: {
                  private: {
                    user_payload: null,
                  },
                },
              },
            },
          },
          integrations: {
            chat: {
              private: {
                user_payload: null,
              },
            },
          },
        },
      },
    },
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchThreadMessageContent(
  threadId: string,
  messageId: string
): Promise<string> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await orchestrateFetch(
      `/v1/orchestrate/threads/${threadId}/messages/${messageId}`
    )

    if (response.ok) {
      const message = await response.json()
      const text = extractAssistantTextFromMessage(message)
      if (text) return text
    }

    await sleep(250 * (attempt + 1))
  }

  return ''
}

async function fetchLatestAssistantMessage(threadId: string): Promise<string> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await orchestrateFetch(
      `/v1/orchestrate/threads/${threadId}/messages`
    )

    if (response.ok) {
      const messages = (await response.json()) as Array<{ role?: string }>
      const assistant = [...messages]
        .reverse()
        .find((message) => message.role === 'assistant')

      const text = extractAssistantTextFromMessage(assistant)
      if (text) return text
    }

    await sleep(250 * (attempt + 1))
  }

  return ''
}

export async function createOrchestrateThread(
  sessionType?: string
): Promise<string> {
  const { agentId, environmentId } = await resolveAgentConfig(sessionType)

  const response = await orchestrateFetch('/v1/orchestrate/threads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: agentId,
      environment_id: environmentId,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Failed to create Orchestrate thread (${response.status}): ${detail}`)
  }

  const data = (await response.json()) as { thread_id?: string }
  if (!isValidUuid(data.thread_id)) {
    throw new Error('Orchestrate did not return a valid thread_id')
  }

  return data.thread_id
}

function isInterviewPrepQuery(message: string): boolean {
  const lower = message.toLowerCase()
  return /interview|preparation|prepare|developer|questions|coding/.test(lower)
}

/** Detect short IBM replies that gate on résumé instead of giving prep content. */
function isResumeGateResponse(content: string): boolean {
  const lower = content.toLowerCase()
  const asksResume =
    /résumé|resume/.test(lower) &&
    /(upload|share|paste|provide|attach|send|do you have)/.test(lower)
  const hasSubstantivePrep =
    content.length > 1400 ||
    /key topics|frequently asked|preparation plan|technical interview|overview of what/i.test(
      content
    )
  return asksResume && !hasSubstantivePrep
}

async function runOrchestrateChatAttempt(params: {
  message: string
  sessionType?: string
  threadId?: string
  onDelta?: (content: string, meta?: { threadId?: string }) => void
  signal?: AbortSignal
}): Promise<{ content: string; threadId?: string; agentName?: string }> {
  const { agentId, environmentId, agentName } = await resolveAgentConfig(
    params.sessionType
  )

  let threadId = isValidUuid(params.threadId) ? params.threadId : undefined

  if (!threadId) {
    threadId = await createOrchestrateThread(params.sessionType)
    params.onDelta?.('', { threadId })
  }

  const llmParams = getLlmParams()

  const response = await orchestrateFetch(
    '/v1/orchestrate/runs?stream=true&stream_timeout=120000&multiple_content=true',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: buildOrchestrateUserMessage(params.message),
        agent_id: agentId,
        environment_id: environmentId,
        thread_id: threadId,
        ...(llmParams ? { llm_params: llmParams } : {}),
      }),
      signal: params.signal,
    }
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Orchestrate chat failed (${response.status}): ${detail}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Orchestrate response body is not readable')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let streamedContent = ''
  let finalContent = ''
  let assistantMessageId: string | undefined

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n')
    buffer = chunks.pop() ?? ''

    for (const rawLine of chunks) {
      const line = rawLine.trim()
      if (!line) continue

      const jsonText = line.startsWith('data:') ? line.slice(5).trim() : line
      if (!jsonText || jsonText === '[DONE]') continue

      try {
        const parsed = JSON.parse(jsonText) as OrchestrateStreamEvent
        const data = parsed.data
        const event = normalizeStreamEvent(parsed)

        if (data && typeof data.thread_id === 'string' && isValidUuid(data.thread_id)) {
          threadId = data.thread_id
        }

        const delta = extractDeltaFromEvent(event, data, parsed)
        if (delta) {
          streamedContent += delta
          params.onDelta?.(delta, { threadId })
        }

        if (event === 'message.created' && data) {
          const created = extractCreatedMessage(data)
          if (created.messageId) {
            assistantMessageId = created.messageId
          }
          if (created.text) {
            finalContent = created.text
          }
        }
      } catch {
        // Ignore malformed stream lines
      }
    }
  }

  let resolvedContent = ''

  if (threadId && assistantMessageId) {
    resolvedContent = await fetchThreadMessageContent(
      threadId,
      assistantMessageId
    )
  }

  if (!resolvedContent && threadId) {
    resolvedContent = await fetchLatestAssistantMessage(threadId)
  }

  if (!resolvedContent) {
    resolvedContent = (finalContent || streamedContent).trim()
  }

  if (!resolvedContent) {
    throw new Error('Orchestrate returned an empty response')
  }

  return { content: resolvedContent, threadId, agentName }
}

const RESUME_GATE_MAX_ATTEMPTS = 3

export async function runOrchestrateChat(params: {
  message: string
  sessionType?: string
  threadId?: string
  onDelta?: (content: string, meta?: { threadId?: string }) => void
  signal?: AbortSignal
}): Promise<{ content: string; threadId?: string; agentName?: string }> {
  const isContinuingThread = isValidUuid(params.threadId)
  const maxAttempts =
    isContinuingThread || !isInterviewPrepQuery(params.message)
      ? 1
      : RESUME_GATE_MAX_ATTEMPTS

  let lastResult: { content: string; threadId?: string; agentName?: string } | null =
    null

  const suppressStreaming = maxAttempts > 1

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const usePassedThread = attempt === 0 && isContinuingThread
    const isLastAttempt = attempt === maxAttempts - 1

    const result = await runOrchestrateChatAttempt({
      ...params,
      threadId: usePassedThread ? params.threadId : undefined,
      onDelta: suppressStreaming ? undefined : params.onDelta,
    })

    lastResult = result

    const shouldRetry =
      !isLastAttempt && isResumeGateResponse(result.content)

    if (!shouldRetry) {
      if (suppressStreaming && params.onDelta && result.content) {
        params.onDelta(result.content, { threadId: result.threadId })
      }
      return result
    }

    console.warn(
      `[orchestrate] Resume-gate reply on attempt ${attempt + 1}/${maxAttempts}; retrying with a fresh thread`
    )
  }

  return lastResult!
}

/** Clear cached agent/environment resolution (e.g. after credential change). */
export function clearOrchestrateAgentCache(): void {
  cachedAgentConfig = null
  cachedEnvFingerprint = null
}
