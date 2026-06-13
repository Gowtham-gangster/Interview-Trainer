'use client'

import { useMemo } from 'react'

import { cn } from '@/lib/utils'

interface VoiceWaveformProps {
  active?: boolean
  barCount?: number
  className?: string
  /** 0–1 playback progress; animates bars up to this point when not active */
  progress?: number
  variant?: 'live' | 'playback' | 'idle'
}

export function VoiceWaveform({
  active = false,
  barCount = 32,
  className,
  progress = 0,
  variant = 'idle',
}: VoiceWaveformProps) {
  const bars = useMemo(
    () =>
      Array.from({ length: barCount }, (_, i) => {
        const center = (barCount - 1) / 2
        const distance = Math.abs(i - center) / center
        const baseHeight = 18 + (1 - distance) * 52
        const delay = (i % 7) * 0.08
        const duration = 0.55 + (i % 5) * 0.12
        return { id: i, baseHeight, delay, duration }
      }),
    [barCount],
  )

  const isLive = variant === 'live' && active
  const isPlayback = variant === 'playback'
  const playedBars = Math.floor(progress * barCount)

  return (
    <div
      className={cn(
        'flex h-16 items-center justify-center gap-[3px] px-2',
        className,
      )}
      aria-hidden
    >
      {bars.map((bar) => {
        const isPlayed = isPlayback && bar.id <= playedBars
        const isCurrent =
          isPlayback && bar.id === playedBars && active

        return (
          <span
            key={bar.id}
            className={cn(
              'w-[3px] rounded-full transition-colors duration-200',
              isLive && 'voice-wave-bar bg-gradient-to-t from-primary/70 to-violet-400',
              isPlayback &&
                (isPlayed || isCurrent
                  ? 'bg-gradient-to-t from-primary/80 to-violet-400'
                  : 'bg-muted-foreground/20'),
              !isLive &&
                !isPlayback &&
                'bg-muted-foreground/25',
              isLive && 'animate-voice-wave',
              isPlayback && isCurrent && active && 'animate-voice-wave',
            )}
            style={{
              height: `${bar.baseHeight}%`,
              animationDelay: `${bar.delay}s`,
              animationDuration: `${bar.duration}s`,
              opacity: isPlayback && !isPlayed && !isCurrent ? 0.45 : 1,
            }}
          />
        )
      })}
    </div>
  )
}
