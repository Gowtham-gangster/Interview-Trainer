import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/auth-options'

export async function getAuthUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  return {
    id: session.user.id,
    name: session.user.name ?? 'User',
    email: session.user.email ?? '',
  }
}

export async function requireAuthUser() {
  const user = await getAuthUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
