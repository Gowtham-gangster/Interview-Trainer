'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import * as z from 'zod'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  marketingCardClassName,
  marketingCardDescriptionClassName,
  marketingCardTitleClassName,
  marketingFieldClassName,
  marketingLabelClassName,
  marketingLinkClassName,
} from '@/lib/styles/marketing-styles'
import { cn } from '@/lib/utils'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

export function ContactForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.message ?? 'Failed to send message')
        return
      }

      setIsSent(true)
      reset()
      toast.success(result.message)
    } catch {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-500/20 dark:bg-emerald-500/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className={`mt-4 text-lg ${marketingCardTitleClassName}`}>
          Message sent
        </h2>
        <p className={`mt-2 ${marketingCardDescriptionClassName}`}>
          Thank you for reaching out. We sent a confirmation to your email and
          will reply within 1–2 business days.
        </p>
        <button
          type="button"
          onClick={() => setIsSent(false)}
          className={`mt-6 ${marketingLinkClassName}`}
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(marketingCardClassName, 'space-y-5')}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name" className={marketingLabelClassName}>
            Your name
          </Label>
          <Input
            id="contact-name"
            placeholder="John Doe"
            className={cn(
              marketingFieldClassName,
              errors.name && 'border-red-500/50'
            )}
            {...register('name')}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-email" className={marketingLabelClassName}>
            Email address
          </Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="you@company.com"
            className={cn(
              marketingFieldClassName,
              errors.email && 'border-red-500/50'
            )}
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject" className={marketingLabelClassName}>
          Subject
        </Label>
        <Input
          id="contact-subject"
          placeholder="How can we help?"
          className={cn(
            marketingFieldClassName,
            errors.subject && 'border-red-500/50'
          )}
          {...register('subject')}
          disabled={isLoading}
        />
        {errors.subject && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.subject.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message" className={marketingLabelClassName}>
          Message
        </Label>
        <Textarea
          id="contact-message"
          rows={5}
          placeholder="Tell us about your question or feedback..."
          className={cn(
            marketingFieldClassName,
            errors.message && 'border-red-500/50'
          )}
          {...register('message')}
          disabled={isLoading}
        />
        {errors.message && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.message.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-b from-cyan-400 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:opacity-95 disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send message
          </>
        )}
      </button>
    </form>
  )
}
