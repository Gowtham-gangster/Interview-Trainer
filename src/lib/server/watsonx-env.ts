/**
 * Server-only watsonx Orchestrate environment variables.
 * Never import this module from client components.
 */

function requireEnv(key: string): string {
  const value = process.env[key]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export function getWatsonxApiKey(): string {
  return requireEnv('WATSONX_API_KEY')
}

export function getWatsonxInstanceUrl(): string {
  const url =
    process.env.WATSONX_INSTANCE_URL?.trim() ||
    process.env.WATSONX_API_URL?.trim()

  if (!url) {
    throw new Error(
      'Missing WATSONX_INSTANCE_URL or WATSONX_API_URL environment variable'
    )
  }

  return url.replace(/\/$/, '')
}

export function isWatsonxServerConfigured(): boolean {
  const apiKey = process.env.WATSONX_API_KEY?.trim()
  const instanceUrl =
    process.env.WATSONX_INSTANCE_URL?.trim() ||
    process.env.WATSONX_API_URL?.trim()

  return Boolean(apiKey && instanceUrl)
}
