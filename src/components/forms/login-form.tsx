'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import * as z from 'zod'

import { AuthDivider } from '@/components/auth/auth-divider'
import {
  authInputClassName,
  authLabelClassName,
  authLinkClassName,
} from '@/components/auth/auth-form-styles'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface LoginFormProps {
  showGoogleAuth?: boolean
}

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

function getCallbackUrl(): string {
  if (typeof window === 'undefined') return '/auth/complete'

  const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl')
  if (!callbackUrl) return '/auth/complete'

  try {
    const url = new URL(callbackUrl, window.location.origin)
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    // Ignore malformed callback URLs.
  }

  return '/auth/complete'
}

export function LoginForm({ showGoogleAuth = true }: LoginFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    router.prefetch('/auth/complete')
    router.prefetch('/chat')
    router.prefetch('/onboarding')
  }, [router])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const callbackUrl = getCallbackUrl()
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'EmailNotVerified') {
          toast.error('Please verify your email before signing in.')
          router.push(
            `/auth/verify-email?email=${encodeURIComponent(data.email.trim().toLowerCase())}`
          )
          return
        }
        toast.error('Invalid email or password')
        return
      }

      toast.success('Welcome back!')
      router.replace(callbackUrl)
    } catch {
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const callbackUrl = getCallbackUrl()

  return (
    <div>
      {showGoogleAuth && (
        <>
          <GoogleSignInButton
            label="Sign in with Google"
            callbackUrl={callbackUrl}
          />
          <AuthDivider />
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className={authLabelClassName}>
          Email address
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={cn(authInputClassName, 'pl-10')}
            {...register('email')}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password" className={authLabelClassName}>
            Password
          </Label>
          <Link
            href="/forgot-password"
            className={cn('text-xs', authLinkClassName)}
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            className={cn(authInputClassName, 'pl-10 pr-10')}
            {...register('password')}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-b from-cyan-400 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01] hover:opacity-95 disabled:pointer-events-none disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
    </div>
  )
}
