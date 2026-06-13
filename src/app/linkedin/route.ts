import { NextResponse } from 'next/server'

import { resolveLinkedInProfileUrl } from '@/lib/contact-info'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const linkedInUrl = resolveLinkedInProfileUrl()

  if (!linkedInUrl) {
    return NextResponse.redirect(new URL('/contact', request.url))
  }

  return NextResponse.redirect(linkedInUrl)
}
