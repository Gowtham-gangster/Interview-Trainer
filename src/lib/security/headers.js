const isProduction = process.env.NODE_ENV === 'production'

function buildContentSecurityPolicy() {
  const directives = [
    "default-src 'self'",
    "worker-src 'self' blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.watson-orchestrate.cloud.ibm.com https://*.speech-to-text.watson.cloud.ibm.com https://*.text-to-speech.watson.cloud.ibm.com https://*.upstash.io",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]

  return directives.join('; ')
}

function getSecurityHeaders() {
  const headers = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'off' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
    {
      key: 'Permissions-Policy',
      value:
        'camera=(), microphone=(self), geolocation=(), payment=(), usb=()',
    },
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
  ]

  if (isProduction) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    })
  }

  return headers
}

module.exports = { getSecurityHeaders, buildContentSecurityPolicy }
