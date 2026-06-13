import { getAppBaseUrl, getAppName } from '@/lib/email/config'

function layout(content: string) {
  const appName = getAppName()

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
      <div style="padding: 24px 0 16px; border-bottom: 1px solid #e2e8f0;">
        <span style="font-size: 18px; font-weight: 700; color: #0891b2;">
          ${appName}
        </span>
      </div>
      <div style="padding: 24px 0;">
        ${content}
      </div>
      <div style="padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      </div>
    </div>
  `
}

function primaryButton(label: string, href: string) {
  return `
    <p style="margin: 28px 0;">
      <a href="${href}"
         style="background: linear-gradient(to bottom, #22d3ee, #2563eb); color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
        ${label}
      </a>
    </p>
  `
}

export function buildPasswordResetEmail(params: {
  userName?: string | null
  resetUrl: string
}) {
  const displayName = params.userName?.trim() || 'there'
  const appName = getAppName()

  const text = [
    `Hi ${displayName},`,
    '',
    `We received a request to reset your password for ${appName}.`,
    '',
    `Reset your password: ${params.resetUrl}`,
    '',
    'This link expires in 1 hour. If you did not request this, you can ignore this email.',
    '',
    `— ${appName}`,
  ].join('\n')

  const html = layout(`
    <h2 style="margin: 0 0 16px; color: #0891b2;">Reset your password</h2>
    <p>Hi ${displayName},</p>
    <p>We received a request to reset your password for <strong>${appName}</strong>.</p>
    ${primaryButton('Reset password', params.resetUrl)}
    <p style="font-size: 14px; color: #64748b;">Or copy this link into your browser:</p>
    <p style="font-size: 13px; word-break: break-all; color: #0891b2;">${params.resetUrl}</p>
    <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
      This link expires in 1 hour. If you did not request this, you can safely ignore this email.
    </p>
  `)

  return {
    subject: `Reset your ${appName} password`,
    text,
    html,
  }
}

export function buildWelcomeEmail(params: {
  userName?: string | null
  loginUrl?: string
}) {
  const displayName = params.userName?.trim() || 'there'
  const appName = getAppName()
  const loginUrl = params.loginUrl ?? `${getAppBaseUrl()}/auth/complete`

  const text = [
    `Hi ${displayName},`,
    '',
    `Welcome to ${appName}! Your account is ready.`,
    '',
    'Here is what you can do next:',
    '• Complete your profile (target role, experience, and skills)',
    '• Start a mock interview with our AI coach',
    '• Upload your resume for personalized questions',
    '',
    `Get started: ${loginUrl}`,
    '',
    `— ${appName} Team`,
  ].join('\n')

  const html = layout(`
    <h2 style="margin: 0 0 16px; color: #0891b2;">Welcome aboard!</h2>
    <p>Hi ${displayName},</p>
    <p>Thanks for joining <strong>${appName}</strong>. Your account is ready and we are excited to help you prepare for your next interview.</p>
    <ul style="padding-left: 20px; color: #475569;">
      <li>Complete your profile with your target role, experience, and skills</li>
      <li>Practice with AI-powered mock interviews</li>
      <li>Upload your resume for tailored feedback</li>
    </ul>
    ${primaryButton('Start practicing', loginUrl)}
    <p style="font-size: 13px; color: #94a3b8;">
      Need help? Reply to this email or visit our contact page.
    </p>
  `)

  return {
    subject: `Welcome to ${appName}`,
    text,
    html,
  }
}

export function buildContactNotificationEmail(params: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const appName = getAppName()

  const text = [
    `New contact form submission for ${appName}`,
    '',
    `Name: ${params.name}`,
    `Email: ${params.email}`,
    `Subject: ${params.subject}`,
    '',
    'Message:',
    params.message,
  ].join('\n')

  const html = layout(`
    <h2 style="margin: 0 0 16px; color: #0891b2;">New contact message</h2>
    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #64748b; width: 80px;">Name</td><td style="padding: 6px 0;"><strong>${params.name}</strong></td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Email</td><td style="padding: 6px 0;"><a href="mailto:${params.email}" style="color: #0891b2;">${params.email}</a></td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Subject</td><td style="padding: 6px 0;">${params.subject}</td></tr>
    </table>
    <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
      <p style="margin: 0; white-space: pre-wrap;">${params.message}</p>
    </div>
  `)

  return {
    subject: `[Contact] ${params.subject}`,
    text,
    html,
  }
}

export function buildEmailVerificationEmail(params: {
  userName?: string | null
  verifyUrl: string
}) {
  const displayName = params.userName?.trim() || 'there'
  const appName = getAppName()

  const text = [
    `Hi ${displayName},`,
    '',
    `Please verify your email address to activate your ${appName} account.`,
    '',
    `Verify your email: ${params.verifyUrl}`,
    '',
    'This link expires in 24 hours.',
    '',
    `— ${appName} Team`,
  ].join('\n')

  const html = layout(`
    <h2 style="margin: 0 0 16px; color: #0891b2;">Verify your email</h2>
    <p>Hi ${displayName},</p>
    <p>Thanks for signing up for <strong>${appName}</strong>. Please confirm your email address to activate your account.</p>
    ${primaryButton('Verify email address', params.verifyUrl)}
    <p style="font-size: 14px; color: #64748b;">Or copy this link into your browser:</p>
    <p style="font-size: 13px; word-break: break-all; color: #0891b2;">${params.verifyUrl}</p>
    <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
      This link expires in 24 hours. If you did not create this account, you can ignore this email.
    </p>
  `)

  return {
    subject: `Verify your ${appName} email`,
    text,
    html,
  }
}

export function buildEmailChangeVerificationEmail(params: {
  userName?: string | null
  newEmail: string
  verifyUrl: string
}) {
  const displayName = params.userName?.trim() || 'there'
  const appName = getAppName()

  const text = [
    `Hi ${displayName},`,
    '',
    `You requested to change your ${appName} account email to ${params.newEmail}.`,
    '',
    `Open this link, sign in if needed, and enter your current password to confirm:`,
    params.verifyUrl,
    '',
    'This link expires in 24 hours. If you did not request this, ignore this email.',
    '',
    `— ${appName} Team`,
  ].join('\n')

  const html = layout(`
    <h2 style="margin: 0 0 16px; color: #0891b2;">Confirm your new email</h2>
    <p>Hi ${displayName},</p>
    <p>You requested to update your <strong>${appName}</strong> account email to <strong>${params.newEmail}</strong>.</p>
    <p>After opening the link, sign in if prompted and enter your <strong>current password</strong> to complete the change.</p>
    ${primaryButton('Confirm new email', params.verifyUrl)}
    <p style="font-size: 14px; color: #64748b;">Or copy this link into your browser:</p>
    <p style="font-size: 13px; word-break: break-all; color: #0891b2;">${params.verifyUrl}</p>
    <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
      This link expires in 24 hours. If you did not request this change, you can ignore this email.
    </p>
  `)

  return {
    subject: `Confirm your new ${appName} email`,
    text,
    html,
  }
}

export function buildContactAutoReplyEmail(params: {
  name: string
}) {
  const displayName = params.name.trim() || 'there'
  const appName = getAppName()

  const text = [
    `Hi ${displayName},`,
    '',
    `Thank you for contacting ${appName}. We received your message and will get back to you within 1–2 business days.`,
    '',
    `— ${appName} Team`,
  ].join('\n')

  const html = layout(`
    <h2 style="margin: 0 0 16px; color: #0891b2;">We received your message</h2>
    <p>Hi ${displayName},</p>
    <p>Thank you for reaching out to <strong>${appName}</strong>. We have received your message and will respond within <strong>1–2 business days</strong>.</p>
    <p style="font-size: 13px; color: #94a3b8;">
      This is an automated confirmation. Please do not reply to this email unless you need to add more details.
    </p>
  `)

  return {
    subject: `We received your message — ${appName}`,
    text,
    html,
  }
}
