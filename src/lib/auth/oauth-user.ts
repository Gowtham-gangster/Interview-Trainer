import {
  LEGACY_DEFAULT_PROFILE,
  NEW_USER_PROFILE,
} from '@/lib/auth/profile-defaults'
import { prisma } from '@/lib/db/prisma'

async function ensureProfileAndSettings(userId: string) {
  const [profile, settings] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ])

  if (!profile) {
    await prisma.userProfile.create({
      data: { userId, ...LEGACY_DEFAULT_PROFILE },
    })
  }

  if (!settings) {
    await prisma.userSettings.create({ data: { userId } })
  }
}

async function updateGoogleAccount(
  accountId: string,
  params: {
    accessToken?: string | null
    refreshToken?: string | null
    expiresAt?: number | null
  }
) {
  await prisma.account.update({
    where: { id: accountId },
    data: {
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      expires_at: params.expiresAt ?? undefined,
    },
  })
}

export type GoogleUserResult = {
  id: string
  email: string
  name: string
  isNewUser: boolean
}

export async function findOrCreateGoogleUser(params: {
  email: string
  name?: string | null
  image?: string | null
  providerAccountId: string
  accessToken?: string | null
  refreshToken?: string | null
  expiresAt?: number | null
}): Promise<GoogleUserResult> {
  const email = params.email.trim().toLowerCase()

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'google',
        providerAccountId: params.providerAccountId,
      },
    },
    include: {
      user: {
        include: { accounts: { where: { provider: 'google' } } },
      },
    },
  })

  if (existingAccount?.user) {
    const user = existingAccount.user

    await updateGoogleAccount(existingAccount.id, params)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name ?? params.name ?? 'User',
        image: params.image ?? user.image,
        email: user.email ?? email,
        emailVerified: user.emailVerified ?? new Date(),
      },
    })

    await ensureProfileAndSettings(user.id)

    return {
      id: user.id,
      email: user.email ?? email,
      name: user.name ?? params.name ?? 'User',
      isNewUser: false,
    }
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
    include: { accounts: { where: { provider: 'google' } } },
  })

  if (existingByEmail) {
    const googleAccount = existingByEmail.accounts[0]

    if (!googleAccount) {
      try {
        await prisma.account.create({
          data: {
            userId: existingByEmail.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: params.providerAccountId,
            access_token: params.accessToken,
            refresh_token: params.refreshToken,
            expires_at: params.expiresAt ?? undefined,
          },
        })
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          return findOrCreateGoogleUser(params)
        }
        throw error
      }
    } else {
      await updateGoogleAccount(googleAccount.id, params)
    }

    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        name: existingByEmail.name ?? params.name ?? 'User',
        image: params.image ?? existingByEmail.image,
        emailVerified: existingByEmail.emailVerified ?? new Date(),
      },
    })

    await ensureProfileAndSettings(existingByEmail.id)

    return {
      id: existingByEmail.id,
      email: existingByEmail.email ?? email,
      name: existingByEmail.name ?? params.name ?? 'User',
      isNewUser: false,
    }
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: params.name ?? 'User',
      image: params.image,
      emailVerified: new Date(),
      profile: { create: { ...NEW_USER_PROFILE } },
      settings: { create: {} },
      accounts: {
        create: {
          type: 'oauth',
          provider: 'google',
          providerAccountId: params.providerAccountId,
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
          expires_at: params.expiresAt ?? undefined,
        },
      },
    },
  })

  return {
    id: user.id,
    email: user.email ?? email,
    name: user.name ?? 'User',
    isNewUser: true,
  }
}

export function isGoogleAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  )
}
