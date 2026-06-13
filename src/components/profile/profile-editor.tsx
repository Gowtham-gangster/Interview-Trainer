'use client'

import { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, X } from 'lucide-react'
import * as z from 'zod'

import { AvatarUpload } from '@/components/profile/avatar-upload'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserAppData } from '@/lib/data/app-storage'
import { registrationEmailZodSchema } from '@/lib/auth/registration-email'
import {
  EXPERIENCE_LEVEL_LABELS,
  type ExperienceLevel,
  type UserProfile,
} from '@/types/profile'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: registrationEmailZodSchema,
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  targetRole: z.string().min(2, 'Target role is required'),
  skillsInput: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileEditorProps {
  profile: UserProfile
  pendingEmail?: string | null
  emailManagedByGoogle?: boolean
  onSave: (
    profile: UserProfile,
    options?: { currentPassword?: string }
  ) => Promise<UserAppData | void>
  onCancel: () => void
  onAvatarChange: (url: string) => void
}

export function ProfileEditor({
  profile,
  pendingEmail,
  emailManagedByGoogle = false,
  onSave,
  onCancel,
  onAvatarChange,
}: ProfileEditorProps) {
  const [skills, setSkills] = useState<string[]>(profile.skills)
  const [skillDraft, setSkillDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const lastCheckedEmailRef = useRef<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: profile.name,
      email: profile.email,
      experienceLevel: profile.experienceLevel,
      targetRole: profile.targetRole,
      skillsInput: profile.skills.join(', '),
    },
  })

  const experienceLevel = watch('experienceLevel')
  const watchedEmail = watch('email')
  const isEmailChanging =
    !emailManagedByGoogle &&
    watchedEmail.trim().toLowerCase() !== profile.email.trim().toLowerCase()

  const checkEmailAvailability = useCallback(
    async (email: string) => {
      if (emailManagedByGoogle) return

      const trimmed = email.trim()
      if (!trimmed) return

      const parsed = registrationEmailZodSchema.safeParse(trimmed)
      if (!parsed.success) {
        setError('email', {
          type: 'manual',
          message:
            parsed.error.issues[0]?.message ?? 'Please enter a valid email address',
        })
        return
      }

      const normalizedEmail = parsed.data
      if (
        normalizedEmail === profile.email.trim().toLowerCase() ||
        lastCheckedEmailRef.current === normalizedEmail
      ) {
        clearErrors('email')
        return
      }

      try {
        const response = await fetch('/api/users/email/check', {
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
        // Server validates again on save.
      }
    },
    [clearErrors, emailManagedByGoogle, profile.email, setError]
  )

  const addSkill = () => {
    const trimmed = skillDraft.trim()
    if (!trimmed || skills.includes(trimmed)) return
    setSkills((prev) => [...prev, trimmed])
    setSkillDraft('')
  }

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((item) => item !== skill))
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (isEmailChanging && !currentPassword.trim()) {
      setPasswordError('Enter your current password to change your email address.')
      return
    }

    setPasswordError(null)
    setIsLoading(true)
    try {
      const parsedSkills =
        skills.length > 0
          ? skills
          : (data.skillsInput ?? '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)

      await onSave(
        {
          ...profile,
          name: data.name,
          email: data.email,
          experienceLevel: data.experienceLevel,
          targetRole: data.targetRole,
          skills: parsedSkills,
        },
        isEmailChanging ? { currentPassword } : undefined
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your details to personalize interview practice sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-center sm:justify-start">
            <AvatarUpload
              name={watch('name') || profile.name}
              avatarUrl={profile.avatar}
              onAvatarChange={onAvatarChange}
            />
          </div>

          {pendingEmail ? (
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-50/80 px-4 py-3 text-sm text-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-100">
              Verification link sent to <strong>{pendingEmail}</strong>. Open it
              and enter your password to confirm the change.
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} disabled={isLoading} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email', {
                  onBlur: (event) => {
                    void checkEmailAvailability(event.target.value)
                  },
                })}
                disabled={isLoading || emailManagedByGoogle}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {isEmailChanging ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <div className="relative max-w-md">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Required to change email"
                    className="pl-10"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value)
                      setPasswordError(null)
                    }}
                    disabled={isLoading}
                  />
                </div>
                {passwordError ? (
                  <p className="text-sm text-destructive">{passwordError}</p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="targetRole">Target Role</Label>
              <Input
                id="targetRole"
                placeholder="e.g. Senior Software Engineer"
                {...register('targetRole')}
                disabled={isLoading}
              />
              {errors.targetRole && (
                <p className="text-sm text-destructive">
                  {errors.targetRole.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select
                value={experienceLevel}
                onValueChange={(value: ExperienceLevel) =>
                  setValue('experienceLevel', value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(EXPERIENCE_LEVEL_LABELS) as [
                      ExperienceLevel,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="skillDraft">Skills</Label>
            <div className="flex gap-2">
              <Input
                id="skillDraft"
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                placeholder="Add a skill and press Enter"
                disabled={isLoading}
              />
              <Button type="button" variant="secondary" onClick={addSkill}>
                Add
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="gap-1 rounded-full border border-primary/20 bg-background pr-1 shadow-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
