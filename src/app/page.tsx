import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { LandingPage } from '@/features/landing/components/landing-page'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/chat')
  }
  
  return <LandingPage />
}