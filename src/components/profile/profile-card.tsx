'use client'

import { Briefcase, GraduationCap, Mail, Pencil, User } from 'lucide-react'

import { AvatarUpload } from '@/components/profile/avatar-upload'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  EXPERIENCE_LEVEL_LABELS,
  type UserProfile,
} from '@/types/profile'

interface ProfileCardProps {
  profile: UserProfile
  onEdit: () => void
  onAvatarChange: (url: string) => void
  isEditing?: boolean
  className?: string
}

export function ProfileCard({
  profile,
  onEdit,
  onAvatarChange,
  isEditing = false,
  className,
}: ProfileCardProps) {
  return (
    <Card
      className={cn(
        'border-border/60 bg-card shadow-sm',
        className
      )}
    >
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <AvatarUpload
              name={profile.name}
              avatarUrl={profile.avatar}
              onAvatarChange={onAvatarChange}
              disabled={isEditing}
            />
            <div className="min-w-0 text-center sm:text-left">
              <h2 className="text-2xl font-semibold tracking-tight">
                {profile.name}
              </h2>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={isEditing}
            className="shrink-0 gap-2 self-center sm:self-auto"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField
            icon={Briefcase}
            label="Target Role"
            value={profile.targetRole}
          />
          <ProfileField
            icon={GraduationCap}
            label="Experience Level"
            value={EXPERIENCE_LEVEL_LABELS[profile.experienceLevel]}
          />
        </div>

        <Separator className="my-6" />

        <div>
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Skills</p>
          </div>

          {profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="rounded-md px-3 py-1 text-sm font-normal"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No skills added yet. Edit your profile to add skills.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3.5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm font-medium leading-snug">{value}</p>
    </div>
  )
}
