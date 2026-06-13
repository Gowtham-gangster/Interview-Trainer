'use client'

import { Mic, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VoiceMicrophoneButtonProps {
  isRecording: boolean
  onStart: () => void
  onStop: () => void
  disabled?: boolean
  size?: 'default' | 'lg'
  className?: string
}

export function VoiceMicrophoneButton({
  isRecording,
  onStart,
  onStop,
  disabled = false,
  size = 'lg',
  className,
}: VoiceMicrophoneButtonProps) {
  const dimensions = size === 'lg' ? 'h-20 w-20' : 'h-14 w-14'
  const iconSize = size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {isRecording && (
        <>
          <span className="absolute inset-0 animate-voice-pulse rounded-full bg-red-500/20" />
          <span
            className="absolute inset-[-8px] animate-voice-pulse rounded-full bg-red-500/10"
            style={{ animationDelay: '0.4s' }}
          />
          <span
            className="absolute inset-[-16px] animate-voice-pulse rounded-full bg-red-500/5"
            style={{ animationDelay: '0.8s' }}
          />
        </>
      )}

      <Button
        type="button"
        disabled={disabled}
        onClick={isRecording ? onStop : onStart}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        className={cn(
          'relative z-10 rounded-full border-0 shadow-lg transition-all duration-300',
          dimensions,
          isRecording
            ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/30 hover:from-red-600 hover:to-rose-700'
            : 'bg-gradient-to-br from-primary via-primary to-violet-600 text-primary-foreground shadow-primary/30 hover:scale-105 hover:shadow-primary/40',
        )}
      >
        <span
          className={cn(
            'absolute inset-2 rounded-full border border-white/20',
            !isRecording && 'bg-white/10',
          )}
        />
        {isRecording ? (
          <Square className={cn(iconSize, 'relative z-10 fill-current')} />
        ) : (
          <Mic className={cn(iconSize, 'relative z-10')} />
        )}
      </Button>
    </div>
  )
}
