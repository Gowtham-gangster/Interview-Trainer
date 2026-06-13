'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { getAuthErrorMessage } from '@/lib/auth/auth-errors'

export function AuthErrorAlert() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    const message = getAuthErrorMessage(error)
    if (message) {
      toast.error(message)
    }
  }, [error])

  return null
}
