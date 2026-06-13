import { NextResponse } from 'next/server'
import { z } from 'zod'

import { isEmailConfigured, sendContactEmails } from '@/lib/email/mailer'
import { enforceRateLimit } from '@/lib/server/rate-limit'

export const runtime = 'nodejs'

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters'),
})

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, 'contact')
  if (rateLimited) return rateLimited

  try {
    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Contact email is not configured yet. Please use the email address shown on this page.',
        },
        { status: 503 },
      )
    }

    const body = contactSchema.parse(await request.json())

    await sendContactEmails({
      name: body.name,
      email: body.email.toLowerCase(),
      subject: body.subject,
      message: body.message,
    })

    return NextResponse.json({
      success: true,
      message:
        'Message sent successfully. We will get back to you within 1–2 business days.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.errors[0]?.message ?? 'Invalid form data',
        },
        { status: 400 },
      )
    }

    console.error('[contact]', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send your message. Please try again later.',
      },
      { status: 500 },
    )
  }
}
