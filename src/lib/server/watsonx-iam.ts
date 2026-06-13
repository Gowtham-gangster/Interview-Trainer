import { getWatsonxApiKey } from './watsonx-env'

const IAM_TOKEN_URL = 'https://iam.cloud.ibm.com/identity/token'

interface CachedToken {
  accessToken: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null

interface IamTokenResponse {
  access_token: string
  expires_in?: number
}

/**
 * Exchange a watsonx Orchestrate API key for a short-lived IBM Cloud IAM bearer token.
 * Tokens are cached in memory and refreshed before expiry.
 */
export async function getIamAccessToken(): Promise<string> {
  const now = Date.now()

  if (cachedToken && now < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken
  }

  const apiKey = getWatsonxApiKey()

  const response = await fetch(IAM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `Failed to obtain IBM IAM token (${response.status}): ${detail}`
    )
  }

  const data = (await response.json()) as IamTokenResponse

  if (!data.access_token) {
    throw new Error('IBM IAM token response did not include access_token')
  }

  const expiresInSeconds = data.expires_in ?? 3600

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + expiresInSeconds * 1000,
  }

  return cachedToken.accessToken
}

/** Clear cached token (useful for tests or forced refresh). */
export function clearIamTokenCache(): void {
  cachedToken = null
}
