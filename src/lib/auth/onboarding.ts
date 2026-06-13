import { prisma } from '@/lib/db/prisma'

export async function getOnboardingCompleted(
  userId: string
): Promise<boolean> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { onboardingCompleted: true },
  })

  return profile?.onboardingCompleted ?? false
}
