'use client'

import { useRef } from 'react'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  name: string
  avatarUrl?: string
  onAvatarChange: (url: string) => void
  disabled?: boolean
  size?: 'default' | 'lg'
  className?: string
}

export function AvatarUpload({
  name,
  avatarUrl,
  onAvatarChange,
  disabled = false,
  size = 'lg',
  className,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const dimensions = size === 'lg' ? 'h-28 w-28' : 'h-20 w-20'
  const buttonSize = size === 'lg' ? 'h-9 w-9' : 'h-8 w-8'

  const handleFileChange = (file: File | undefined) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, or WebP)')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onAvatarChange(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar
        className={cn(
          dimensions,
          'border-2 border-border shadow-sm',
        )}
      >
        <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
        <AvatarFallback className="bg-muted text-lg font-semibold text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFileChange(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      <Button
        type="button"
        size="icon"
        variant="secondary"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'absolute -bottom-1 -right-1 rounded-full shadow-md',
          buttonSize,
        )}
        aria-label="Upload avatar"
      >
        <Camera className="h-4 w-4" />
      </Button>
    </div>
  )
}
