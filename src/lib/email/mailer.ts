import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

import {
  getContactInboxEmail,
  getEmailFromAddress,
  getSmtpConfig,
  isEmailConfigured,
} from '@/lib/email/config'
import {
  buildContactAutoReplyEmail,
  buildContactNotificationEmail,
  buildEmailChangeVerificationEmail,
  buildEmailVerificationEmail,
  buildPasswordResetEmail,
  buildWelcomeEmail,
} from '@/lib/email/templates'

export { isEmailConfigured, getContactInboxEmail, getEmailFromAddress }

let transporter: Transporter | null = null

function getTransporter() {
  const smtp = getSmtpConfig()
  if (!smtp) {
    throw new Error(
      'Email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.',
    )
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    })
  }

  return transporter
}

async function sendEmail(params: {
  to: string
  subject: string
  text: string
  html: string
  replyTo?: string
}) {
  const from = getEmailFromAddress()

  await getTransporter().sendMail({
    from,
    to: params.to,
    replyTo: params.replyTo,
    subject: params.subject,
    text: params.text,
    html: params.html,
  })
}

export async function sendPasswordResetEmail(params: {
  to: string
  resetUrl: string
  userName?: string | null
}) {
  const content = buildPasswordResetEmail({
    userName: params.userName,
    resetUrl: params.resetUrl,
  })

  await sendEmail({
    to: params.to,
    ...content,
  })
}

export async function sendWelcomeEmail(params: {
  to: string
  userName?: string | null
  loginUrl?: string
}) {
  const content = buildWelcomeEmail({
    userName: params.userName,
    loginUrl: params.loginUrl,
  })

  await sendEmail({
    to: params.to,
    ...content,
  })
}

export async function sendContactEmails(params: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const notification = buildContactNotificationEmail(params)
  const autoReply = buildContactAutoReplyEmail({ name: params.name })

  await sendEmail({
    to: getContactInboxEmail(),
    replyTo: params.email,
    ...notification,
  })

  await sendEmail({
    to: params.email,
    ...autoReply,
  })
}

export async function sendEmailVerificationEmail(params: {
  to: string
  userName?: string | null
  verifyUrl: string
}) {
  const content = buildEmailVerificationEmail({
    userName: params.userName,
    verifyUrl: params.verifyUrl,
  })

  await sendEmail({
    to: params.to,
    ...content,
  })
}

export async function sendEmailVerificationSafe(params: {
  to: string
  userName?: string | null
  verifyUrl: string
}) {
  if (!isEmailConfigured()) return

  try {
    await sendEmailVerificationEmail(params)
  } catch (error) {
    console.error('[email] Failed to send verification email:', error)
  }
}

export async function sendEmailChangeVerificationEmail(params: {
  to: string
  userName?: string | null
  newEmail: string
  verifyUrl: string
}) {
  const content = buildEmailChangeVerificationEmail({
    userName: params.userName,
    newEmail: params.newEmail,
    verifyUrl: params.verifyUrl,
  })

  await sendEmail({
    to: params.to,
    ...content,
  })
}

export async function sendEmailChangeVerificationSafe(params: {
  to: string
  userName?: string | null
  newEmail: string
  verifyUrl: string
}) {
  if (!isEmailConfigured()) return

  try {
    await sendEmailChangeVerificationEmail(params)
  } catch (error) {
    console.error('[email] Failed to send email change verification:', error)
    throw error
  }
}

export async function sendWelcomeEmailSafe(params: {
  to: string
  userName?: string | null
  loginUrl?: string
}) {
  if (!isEmailConfigured()) return

  try {
    await sendWelcomeEmail(params)
  } catch (error) {
    console.error('[email] Failed to send welcome email:', error)
  }
}
