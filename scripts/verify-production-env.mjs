const REQUIRED = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'DATABASE_URL',
  'WATSONX_API_KEY',
  'WATSONX_INSTANCE_URL',
  'WATSONX_AGENT_ID',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
]

const RECOMMENDED = [
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'WATSON_STT_API_KEY',
  'WATSON_TTS_API_KEY',
]

const RATE_LIMIT_KEYS = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']

function check() {
  console.log('\n=== Production environment check ===\n')

  let errors = 0
  let warnings = 0

  for (const key of REQUIRED) {
    const value = process.env[key]?.trim()
    if (!value) {
      console.log(`  FAIL  ${key} is not set`)
      errors++
      continue
    }

    if (key === 'NEXTAUTH_URL' && !value.startsWith('https://')) {
      console.log(`  FAIL  ${key} must use https:// in production`)
      errors++
      continue
    }

    if (key === 'NEXTAUTH_SECRET' && value.length < 32) {
      console.log(`  FAIL  ${key} is too short (use npm run generate:secrets)`)
      errors++
      continue
    }

    if (
      (key === 'NEXTAUTH_SECRET' && value.includes('local-dev')) ||
      (key === 'WATSONX_API_KEY' && value.startsWith('SuF2'))
    ) {
      console.log(`  WARN  ${key} looks like a dev/leaked value — rotate before deploy`)
      warnings++
      continue
    }

    console.log(`  OK    ${key}`)
  }

  for (const key of RECOMMENDED) {
    if (!process.env[key]?.trim()) {
      console.log(`  WARN  ${key} is not set (recommended for production)`)
      warnings++
    } else {
      console.log(`  OK    ${key}`)
    }
  }

  const redisConfigured = RATE_LIMIT_KEYS.every((key) =>
    Boolean(process.env[key]?.trim())
  )
  if (!redisConfigured) {
    console.log(
      '  FAIL  UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are required for production rate limiting on Vercel'
    )
    errors++
  } else {
    console.log('  OK    UPSTASH_REDIS (rate limiting)')
  }

  if (process.env.RATE_LIMIT_DISABLED === 'true') {
    console.log('  FAIL  RATE_LIMIT_DISABLED=true must not be set in production')
    errors++
  }

  console.log(`\n${errors} error(s), ${warnings} warning(s)\n`)

  if (errors > 0) process.exit(1)
}

check()
