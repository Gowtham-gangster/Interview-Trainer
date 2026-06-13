'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Briefcase, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import * as z from 'zod'

import {
  authInputClassName,
  authLabelClassName,
} from '@/components/auth/auth-form-styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { completeUserOnboarding } from '@/lib/api/user-data-service'
import { cn } from '@/lib/utils'
import {
  EXPERIENCE_LEVEL_LABELS,
  type ExperienceLevel,
} from '@/types/profile'

const onboardingSchema = z.object({
  targetRole: z.string().trim().min(2, 'Target role is required'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

export function OnboardingForm() {
  const router = useRouter()
  const { update } = useSession()
  const [skills, setSkills] = useState<string[]>([])
  const [skillDraft, setSkillDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      targetRole: '',
      experienceLevel: 'intermediate',
    },
  })

  const experienceLevel = watch('experienceLevel')

  const addSkill = () => {
    const trimmed = skillDraft.trim()
    if (!trimmed || skills.includes(trimmed)) return
    setSkills((prev) => [...prev, trimmed])
    setSkillDraft('')
  }

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((item) => item !== skill))
  }

  const onSubmit = async (data: OnboardingFormData) => {
    if (skills.length === 0) {
      toast.error('Add at least one skill')
      return
    }

    setIsLoading(true)
    try {
      await completeUserOnboarding({
        targetRole: data.targetRole,
        experienceLevel: data.experienceLevel,
        skills,
      })

      await update({ onboardingCompleted: true })
      toast.success('Profile saved! Starting your interview prep...')
      router.push('/chat')
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save profile'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="targetRole" className={authLabelClassName}>
          Target role
        </Label>
        <div className="relative">
          <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="targetRole"
            placeholder="e.g. Software Engineer, Data Analyst"
            className={cn(authInputClassName, 'pl-10')}
            {...register('targetRole')}
            disabled={isLoading}
          />
        </div>
        {errors.targetRole && (
          <p className="text-sm text-red-400">{errors.targetRole.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className={authLabelClassName}>Experience level</Label>
        <Select
          value={experienceLevel}
          onValueChange={(value: ExperienceLevel) =>
            setValue('experienceLevel', value)
          }
          disabled={isLoading}
        >
          <SelectTrigger className={authInputClassName}>
            <SelectValue placeholder="Select your experience" />
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
        {errors.experienceLevel && (
          <p className="text-sm text-red-400">
            {errors.experienceLevel.message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="skillDraft" className={authLabelClassName}>
          Skills
        </Label>
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
            placeholder="e.g. React, Python, Communication"
            className={authInputClassName}
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addSkill}
            disabled={isLoading}
          >
            Add
          </Button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="gap-1 rounded-full border border-cyan-500/20 bg-slate-50 pr-1 dark:bg-[#070d1f]"
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

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-b from-cyan-400 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01] hover:opacity-95 disabled:pointer-events-none disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Continue to chat'
        )}
      </button>
    </form>
  )
}
