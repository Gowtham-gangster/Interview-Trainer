import { getIamAccessToken } from './watsonx-iam'
import { getWatsonxInstanceUrl } from './watsonx-env'

export async function orchestrateFetch(path: string, init?: RequestInit) {
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
