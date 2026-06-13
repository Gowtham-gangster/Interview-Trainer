'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { VoiceWaveform } from './voice-waveform'

interface VoicePlaybackProps {
  duration: number
  audioUrl?: string | null
  isPlaying: boolean
  progress: number
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onDelete: () => void
  className?: string
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function VoicePlayback({
  duration,
  audioUrl,
  isPlaying,
  progress,
  onPlay,
  onPause,
  onReset,
  onDelete,
  className,
}: VoicePlaybackProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playbackProgress, setPlaybackProgress] = useState(progress)
  const [playbackDuration, setPlaybackDuration] = useState(duration)

  useEffect(() => {
    if (!audioUrl) {
      setPlaybackProgress(progress)
      setPlaybackDuration(duration)
      return
    }

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setPlaybackDuration(audio.duration)
      }
    }

    audio.ontimeupdate = () => {
      if (!audio.duration) return
      setPlaybackProgress(audio.currentTime / audio.duration)
    }

    audio.onended = () => {
      setPlaybackProgress(1)
      onPause()
    }

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [audioUrl, duration, onPause, progress])

  const handlePlay = () => {
    if (audioRef.current) {
      void audioRef.current.play()
    }
    onPlay()
  }

  const handlePause = () => {
    audioRef.current?.pause()
    onPause()
  }

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaybackProgress(0)
    }
    onReset()
  }

  const currentTime = playbackProgress * playbackDuration

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
        <VoiceWaveform
          variant="playback"
          active={isPlaying}
          progress={playbackProgress}
          barCount={40}
        />
        <div className="flex items-center justify-between px-1 text-xs tabular-nums text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(playbackDuration)}</span>
        </div>
      </div>

      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-violet-500 transition-[width] duration-100 ease-linear"
          style={{ width: `${playbackProgress * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleReset}
          className="h-9 w-9 rounded-full"
          aria-label="Reset playback"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          onClick={isPlaying ? handlePause : handlePlay}
          className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-violet-600 shadow-md shadow-primary/25"
          aria-label={isPlaying ? 'Pause playback' : 'Play recording'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current translate-x-0.5" />
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onDelete}
          className="h-9 w-9 rounded-full text-destructive hover:text-destructive"
          aria-label="Delete recording"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
