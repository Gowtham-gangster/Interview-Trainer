/**
 * Resolve the BFF base URL for API calls.
 * In the browser always use same-origin `/api` so Vercel/production works
 * even when NEXT_PUBLIC_API_BASE_URL was not set at build time.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api'
  }

  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    `${(process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')}/api`
  )
}
