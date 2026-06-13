const baseUrl = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

const REQUIRED_HEADERS = [
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'content-security-policy',
  'permissions-policy',
  'cross-origin-opener-policy',
]

const PRODUCTION_HEADERS = ['strict-transport-security']

async function main() {
  console.log(`\nTesting security headers at ${baseUrl}\n`)

  let response
  try {
    response = await fetch(baseUrl, { redirect: 'manual' })
  } catch (error) {
    console.error('Failed to reach server. Start with: npm run build && npm run start')
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }

  const headers = Object.fromEntries(
    [...response.headers.entries()].map(([key, value]) => [key.toLowerCase(), value])
  )

  let failed = false

  for (const name of REQUIRED_HEADERS) {
    if (headers[name]) {
      console.log(`  OK  ${name}`)
    } else {
      console.log(`  FAIL  ${name} (missing)`)
      failed = true
    }
  }

  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction) {
    for (const name of PRODUCTION_HEADERS) {
      if (headers[name]) {
        console.log(`  OK  ${name}`)
      } else {
        console.log(`  FAIL  ${name} (missing in production)`)
        failed = true
      }
    }
  } else {
    console.log('  SKIP strict-transport-security (NODE_ENV is not production)')
  }

  if (headers['content-security-policy']?.includes('upgrade-insecure-requests')) {
    console.log('  OK  CSP includes upgrade-insecure-requests')
  } else {
    console.log('  FAIL  CSP missing upgrade-insecure-requests')
    failed = true
  }

  console.log(`\nHTTP status: ${response.status}\n`)

  if (failed) {
    process.exit(1)
  }

  console.log('All security header checks passed.\n')
}

main()
