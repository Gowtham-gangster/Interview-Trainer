'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react'
import * as z from 'zod'

import {
  authInputClassName,
  authLabelClassName,
} from '@/components/auth/auth-form-styles'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setFormError('')
    clearErrors('email')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      const result = await response.json()

      if (!response.ok) {
        const message =
          (result.message as string) ??
          'Failed to send reset link. Please try again.'

        if (response.status === 404 || response.status === 400) {
          setError('email', { message })
        } else {
          setFormError(message)
        }
        return
      }

      setSubmittedEmail(
        (result.email as string) ?? data.email.trim().toLowerCase(),
      )
      setEmailSent(true)
    } catch {
      setFormError('Failed to send reset link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            Sent successfully
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Password reset link sent to{' '}
            <span className="font-medium text-cyan-600 dark:text-cyan-400">
              {submittedEmail}
            </span>
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Check your inbox and spam folder. The link expires in 1 hour.
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-cyan-500/30 bg-[#070d1f]/40 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
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
            className={cn(
              authInputClassName,
              'pl-10',
              errors.email && 'border-red-500/50 focus-visible:border-red-400/50',
            )}
            {...register('email')}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      {formError && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-b from-cyan-400 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01] hover:opacity-95 disabled:pointer-events-none disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending link...
          </>
        ) : (
          'Send reset link'
        )}
      </button>

      <Link
        href="/login"
        className="inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium text-slate-400 transition-colors hover:text-cyan-400"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to sign in
      </Link>
    </form>
  )
}
