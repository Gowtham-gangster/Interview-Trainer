'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { toast } from 'sonner'
import * as z from 'zod'

import { AuthDivider } from '@/components/auth/auth-divider'
import {
  authInputClassName,
  authLabelClassName,
  authLinkClassName,
  authTermsBoxClassName,
  authTermsLabelClassName,
} from '@/components/auth/auth-form-styles'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registrationEmailZodSchema } from '@/lib/auth/registration-email'
import { cn } from '@/lib/utils'

interface RegisterFormProps {
  showGoogleAuth?: boolean
}

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: registrationEmailZodSchema,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm({ showGoogleAuth = true }: RegisterFormProps) {
  const router = useRouter()

  useEffect(() => {
    router.prefetch('/auth/complete')
    router.prefetch('/onboarding')
    router.prefetch('/chat')
  }, [router])
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const lastCheckedEmailRef = useRef<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  const termsAccepted = watch('terms')

  const checkEmailAvailability = useCallback(
    async (email: string) => {
      const trimmed = email.trim()
      if (!trimmed) return

      const parsed = registrationEmailZodSchema.safeParse(trimmed)
      if (!parsed.success) {
        setError('email', {
          type: 'manual',
          message:
            parsed.error.issues[0]?.message ??
            'Please enter a valid email address',
        })
        return
      }

      const normalizedEmail = parsed.data
      if (lastCheckedEmailRef.current === normalizedEmail) return

      try {
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        })

        const result = (await response.json()) as {
          available?: boolean
          message?: string
        }

        if (!response.ok) return

        lastCheckedEmailRef.current = normalizedEmail

        if (!result.available && result.message) {
          setError('email', { type: 'manual', message: result.message })
          return
        }

        clearErrors('email')
      } catch {
        // Non-blocking: server still validates on submit.
      }
    },
    [clearErrors, setError]
  )

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      const result = (await response.json()) as {
        message?: string
        requiresEmailVerification?: boolean
      }

      if (!response.ok) {
        const message = result.message ?? 'Registration failed'
        if (response.status === 409) {
          setError('email', { type: 'manual', message })
        }
        toast.error(message)
        return
      }

      if (result.requiresEmailVerification) {
        toast.success('Account created. Please verify your email to continue.')
        router.replace(
          `/auth/verify-email?email=${encodeURIComponent(data.email.trim().toLowerCase())}`
        )
        return
      }

      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast.success('Account created. Please sign in.')
        router.push('/login')
        return
      }

      toast.success('Account created successfully!')
      router.replace('/auth/complete')
    } catch {
      toast.error('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {showGoogleAuth && (
        <>
          <GoogleSignInButton
            label="Sign up with Google"
            callbackUrl="/auth/complete"
          />
          <AuthDivider />
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className={authLabelClassName}>
          Full name
        </Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            className={cn(authInputClassName, 'pl-10')}
            {...register('name')}
            disabled={isLoading}
          />
        </div>
        {errors.name && (
          <p className="text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

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
            placeholder="you@mlrit.ac.in"
            className={cn(authInputClassName, 'pl-10')}
            {...register('email', {
              onBlur: (event) => {
                void checkEmailAvailability(event.target.value)
              },
            })}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password" className={authLabelClassName}>
            Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className={authLabelClassName}>
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat password"
              className={cn(authInputClassName, 'pl-10 pr-10')}
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
              aria-label={
                showConfirmPassword ? 'Hide password' : 'Show password'
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <div className={authTermsBoxClassName}>
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(checked) => setValue('terms', checked === true)}
          disabled={isLoading}
          className="mt-0.5 border-cyan-500/30 data-[state=checked]:border-cyan-400 data-[state=checked]:bg-cyan-500"
        />
        <label htmlFor="terms" className={authTermsLabelClassName}>
          I agree to the{' '}
          <Link href="/terms" className={authLinkClassName}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className={authLinkClassName}>
            Privacy Policy
          </Link>
        </label>
      </div>
      {errors.terms && (
        <p className="text-sm text-red-400">{errors.terms.message}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-b from-cyan-400 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01] hover:opacity-95 disabled:pointer-events-none disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </button>
    </form>
    </div>
  )
}
