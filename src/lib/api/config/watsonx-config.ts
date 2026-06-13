/**
 * IBM watsonx Orchestrate frontend configuration.
 *
 * Backend will provide:
 * - Service Instance URL  → NEXT_PUBLIC_WATSONX_SERVICE_URL
 * - API Endpoints         → NEXT_PUBLIC_API_BASE_URL (BFF)
 * - Authentication        → Bearer token via auth_token / session
 *
 * Set NEXT_PUBLIC_WATSONX_USE_MOCK=true only for offline UI development.
 */

export interface WatsonxConfig {
  /** BFF base URL (proxies to watsonx Orchestrate) */
  apiBaseUrl: string
  /** watsonx service instance URL (informational / health) */
  serviceInstanceUrl: string | null
  /** Default assistant ID for Orchestrate */
  assistantId: string | null
  /** Use in-memory mock adapters instead of HTTP */
  useMock: boolean
  /** Request timeout (ms) */
  timeoutMs: number
  /** Enable voice features in UI */
  voiceEnabled: boolean
}

function readEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

export const watsonxConfig: WatsonxConfig = {
  apiBaseUrl:
    readEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000/api'),
  serviceInstanceUrl:
    readEnv('NEXT_PUBLIC_WATSONX_SERVICE_URL') ||
    readEnv('WATSONX_INSTANCE_URL') ||
    readEnv('WATSONX_API_URL') ||
    null,
  assistantId: readEnv('NEXT_PUBLIC_WATSONX_ASSISTANT_ID') || null,
  useMock: readEnv('NEXT_PUBLIC_WATSONX_USE_MOCK', 'false') === 'true',
  timeoutMs: Number(readEnv('NEXT_PUBLIC_API_TIMEOUT_MS', '30000')),
  voiceEnabled: readEnv('NEXT_PUBLIC_ENABLE_VOICE', 'true') === 'true',
}

export function isWatsonxMockMode(): boolean {
  return watsonxConfig.useMock
}
