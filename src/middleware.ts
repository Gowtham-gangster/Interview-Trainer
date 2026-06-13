import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/chat', '/profile', '/settings']
const ONBOARDING_PATH = '/onboarding'

function redirectToHttps(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null

  const forwarded = request.headers.get('x-forwarded-proto')
  const protocol = forwarded?.split(',')[0]?.trim()

  if (protocol !== 'http') return null

  const httpsUrl = request.nextUrl.clone()
  httpsUrl.protocol = 'https:'
  return NextResponse.redirect(httpsUrl, 301)
}

function isProtectedPath(pathname: string): boolean {
  return (
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname === ONBOARDING_PATH
  )
}

export async function middleware(request: NextRequest) {
  const httpsRedirect = redirectToHttps(request)
  if (httpsRedirect) return httpsRedirect

  const { pathname } = request.nextUrl
  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token?.id) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const onboardingCompleted = token.onboardingCompleted

  if (onboardingCompleted === false && pathname !== ONBOARDING_PATH) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (onboardingCompleted === true && pathname === ONBOARDING_PATH) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
