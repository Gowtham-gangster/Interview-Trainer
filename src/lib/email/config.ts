export function getAppBaseUrl() {
  return process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export function getAppName() {
  return 'AI Interview Trainer'
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD?.replace(/\s/g, '')

  if (!host || !user || !pass) {
    return null
  }

  return { host, port, user, pass }
}

export function isEmailConfigured() {
  return getSmtpConfig() !== null
}

export function getEmailFromAddress() {
  const smtp = getSmtpConfig()
  return process.env.SMTP_FROM ?? (smtp ? `${getAppName()} <${smtp.user}>` : '')
}

export function getContactInboxEmail() {
  return (
    process.env.CONTACT_EMAIL ??
    process.env.SMTP_USER ??
    'support@example.com'
  )
}

export { getSmtpConfig }
