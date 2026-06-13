import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

import { getOnboardingCompleted } from '@/lib/auth/onboarding'
import { findOrCreateGoogleUser } from '@/lib/auth/oauth-user'
import { prisma } from '@/lib/db/prisma'
import { getAppBaseUrl } from '@/lib/email/config'
import { isEmailConfigured, sendWelcomeEmailSafe } from '@/lib/email/mailer'

function shouldUseSecureAuthCookies(): boolean {
  const url = process.env.NEXTAUTH_URL?.trim()
  if (url) return url.startsWith('https://')
  return process.env.NODE_ENV === 'production' && Boolean(process.env.VERCEL)
}

function getGoogleSignInErrorRedirect(error: unknown): string {
  if (error instanceof Error && 'code' in error) {
    const code = String(error.code)
    if (code === 'P2002') return '/login?error=OAuthAccountNotLinked'
    if (
      code === 'P1000' ||
      code === 'P1001' ||
      code === 'P1002' ||
      code === 'P1017' ||
      code === 'P2021'
    ) {
      return '/login?error=DatabaseUnavailable'
    }
  }

  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (
    message.includes("can't reach database") ||
    message.includes('econnrefused') ||
    message.includes('connection timed out') ||
    message.includes('does not exist')
  ) {
    return '/login?error=DatabaseUnavailable'
  }

  return '/login?error=OAuthCreateAccount'
}

function buildProviders(): NextAuthOptions['providers'] {
  const providers: NextAuthOptions['providers'] = [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        verificationToken: { label: 'Verification Token', type: 'text' },
      },
      async authorize(credentials) {
        if (credentials?.verificationToken) {
          const { consumePostVerificationLoginToken } = await import(
            '@/lib/auth/email-verification'
          )
          const userId = await consumePostVerificationLoginToken(
            credentials.verificationToken
          )

          if (!userId) return null

          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: { select: { onboardingCompleted: true } } },
          })

          if (!user?.email || !user.emailVerified) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? 'User',
            onboardingCompleted: user.profile?.onboardingCompleted ?? false,
          }
        }

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { verifyUser, toPublicUser } = await import('@/lib/auth/user-store')
        const result = await verifyUser(credentials.email, credentials.password, {
          requireEmailVerification: isEmailConfigured(),
        })

        if (result.status === 'unverified') {
          throw new Error('EmailNotVerified')
        }

        if (result.status !== 'ok') return null

        const publicUser = toPublicUser(result.user)
        return {
          id: publicUser.id,
          email: publicUser.email,
          name: publicUser.name,
          onboardingCompleted: result.user.onboardingCompleted,
        }
      },
    }),
  ]

  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (googleClientId && googleClientSecret) {
    providers.unshift(
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        allowDangerousEmailAccountLinking: true,
        authorization: {
          params: {
            prompt: 'select_account',
            access_type: 'offline',
            response_type: 'code',
            scope: 'openid email profile',
          },
        },
      }),
    )
  }

  return providers
}

export function getAuthOptions(): NextAuthOptions {
  return {
    providers: buildProviders(),
    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider !== 'google') {
          return true
        }

        const email = user.email ?? profile?.email
        if (!email) {
          console.error('[auth] Google sign-in missing email')
          return '/login?error=OAuthCallback'
        }

        const googleProfile = profile as { email_verified?: boolean } | undefined
        if (googleProfile?.email_verified === false) {
          console.error('[auth] Google sign-in email not verified by Google:', email)
          return '/register?error=GoogleEmailNotVerified'
        }

        const parsedEmail = (await import('@/lib/auth/registration-email'))
          .parseRegistrationEmail(email)
        if (!parsedEmail.ok) {
          console.error('[auth] Google sign-in invalid email format:', email)
          return '/register?error=OAuthCallback'
        }

        if (!account.providerAccountId) {
          console.error('[auth] Google sign-in missing provider account id')
          return '/login?error=OAuthCallback'
        }

        try {
          const dbUser = await findOrCreateGoogleUser({
            email: parsedEmail.email,
            name: user.name ?? profile?.name,
            image:
              user.image ??
              (profile as { picture?: string | null } | undefined)?.picture,
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
          })

          if (dbUser.isNewUser) {
            void sendWelcomeEmailSafe({
              to: dbUser.email,
              userName: dbUser.name,
              loginUrl: `${getAppBaseUrl()}/auth/complete`,
            })
          }

          return true
        } catch (error) {
          console.error('[auth] Google signIn failed:', error)
          return getGoogleSignInErrorRedirect(error)
        }
      },
      async jwt({ token, user, account, trigger, session }) {
        if (trigger === 'update' && session) {
          if (session.onboardingCompleted !== undefined) {
            token.onboardingCompleted = session.onboardingCompleted
          }

          const updatedUser = session.user
          if (updatedUser?.name !== undefined) {
            token.name = updatedUser.name
          }
          if (updatedUser?.email !== undefined) {
            token.email = updatedUser.email
          }
          if (updatedUser?.image !== undefined) {
            token.picture = updatedUser.image
          }

          return token
        }

        if (user) {
          if (account?.provider === 'google') {
            const email = user.email?.trim().toLowerCase()
            const userSelect = {
              id: true,
              email: true,
              name: true,
              profile: { select: { onboardingCompleted: true } },
            } as const

            const [userByEmail, linkedAccount] = await Promise.all([
              email
                ? prisma.user.findUnique({
                    where: { email },
                    select: userSelect,
                  })
                : Promise.resolve(null),
              account.providerAccountId
                ? prisma.account.findUnique({
                    where: {
                      provider_providerAccountId: {
                        provider: 'google',
                        providerAccountId: account.providerAccountId,
                      },
                    },
                    select: { user: { select: userSelect } },
                  })
                : Promise.resolve(null),
            ])

            const dbUser = userByEmail ?? linkedAccount?.user ?? null

            if (!dbUser) {
              console.error('[auth] Google user missing after signIn callback:', {
                email,
                providerAccountId: account.providerAccountId,
              })
              return token
            }

            token.id = dbUser.id
            token.email = dbUser.email ?? user.email
            token.name = dbUser.name ?? user.name ?? 'User'
            token.onboardingCompleted =
              dbUser.profile?.onboardingCompleted ?? false
          } else {
            token.id = user.id
            token.email = user.email
            token.name = user.name

            const credentialsUser = user as typeof user & {
              onboardingCompleted?: boolean
            }
            if (credentialsUser.onboardingCompleted !== undefined) {
              token.onboardingCompleted = credentialsUser.onboardingCompleted
            } else if (token.id) {
              token.onboardingCompleted = await getOnboardingCompleted(
                token.id as string
              )
            }
          }
        }

        if (account?.access_token) {
          token.accessToken = account.access_token
        }

        return token
      },
      async session({ session, token }) {
        if (token) {
          session.accessToken = token.accessToken as string
          session.onboardingCompleted = token.onboardingCompleted as
            | boolean
            | undefined
          if (session.user) {
            session.user.id = token.id as string
            session.user.email = (token.email as string) ?? session.user.email
            session.user.name = (token.name as string) ?? session.user.name
            session.user.image =
              (token.picture as string | null | undefined) ?? session.user.image
          }
        }
        return session
      },
      async redirect({ url, baseUrl }) {
        if (url.startsWith('/')) return `${baseUrl}${url}`
        try {
          if (new URL(url).origin === baseUrl) return url
        } catch {
          // Ignore malformed callback URLs.
        }
        return `${baseUrl}/auth/complete`
      },
    },
    useSecureCookies: shouldUseSecureAuthCookies(),
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60,
    },
    jwt: {
      maxAge: 30 * 24 * 60 * 60,
    },
    pages: {
      signIn: '/login',
      error: '/login',
      verifyRequest: '/login',
      newUser: '/onboarding',
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
}

export const authOptions = getAuthOptions()

