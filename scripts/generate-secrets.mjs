import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const secret = randomBytes(32).toString('base64')

console.log('\n=== Generated production secret ===\n')
console.log(`NEXTAUTH_SECRET=${secret}`)
console.log('\nAdd this to your hosting provider env vars and .env.local for testing.\n')

const envLocalPath = resolve(root, '.env.local')
if (existsSync(envLocalPath)) {
  const current = readFileSync(envLocalPath, 'utf8')
  const updated = current.replace(
    /^NEXTAUTH_SECRET=.*$/m,
    `NEXTAUTH_SECRET=${secret}`
  )
  if (updated !== current) {
    writeFileSync(envLocalPath, updated, 'utf8')
    console.log('Updated NEXTAUTH_SECRET in .env.local (existing sessions will be signed out).\n')
  }
}

console.log('IBM API keys must be rotated manually in IBM Cloud Console:')
console.log('  1. watsonx Orchestrate → Service credentials → Create new API key')
console.log('  2. Speech to Text → Create new API key')
console.log('  3. Text to Speech → Create new API key')
console.log('  4. Delete old keys after updating WATSONX_* and WATSON_STT/TTS_* env vars')
console.log('  5. Regenerate Google OAuth client secret if it was ever shared\n')
