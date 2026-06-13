'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface LiveAudioWaveformProps {
  analyser: AnalyserNode | null
  barCount?: number
  className?: string
  onSignalChange?: (hasSignal: boolean) => void
}

const SIGNAL_RMS_THRESHOLD = 0.012
const SIGNAL_FRAMES_REQUIRED = 4

function readInputRms(analyser: AnalyserNode): number {
  const timeData = new Uint8Array(analyser.fftSize)
  analyser.getByteTimeDomainData(timeData)

  let sumSquares = 0
  for (let i = 0; i < timeData.length; i += 1) {
    const sample = (timeData[i] - 128) / 128
    sumSquares += sample * sample
  }

  return Math.sqrt(sumSquares / timeData.length)
}

function rmsToDisplayLevel(rms: number): number {
  return Math.max(0.08, Math.min(1, rms * 8))
}

export function LiveAudioWaveform({
  analyser,
  barCount = 36,
  className,
  onSignalChange,
}: LiveAudioWaveformProps) {
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 0.08)
  )
  const frameRef = useRef<number | null>(null)
  const lastSignalRef = useRef(false)
  const signalFrameCountRef = useRef(0)

  useEffect(() => {
    if (!analyser) {
      setLevels(Array.from({ length: barCount }, () => 0.08))
      signalFrameCountRef.current = 0
      return
    }

    const frequencyData = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      const rms = readInputRms(analyser)
      const displayLevel = rmsToDisplayLevel(rms)

      if (rms >= SIGNAL_RMS_THRESHOLD) {
        signalFrameCountRef.current += 1
      } else {
        signalFrameCountRef.current = 0
      }

      const hasSignal = signalFrameCountRef.current >= SIGNAL_FRAMES_REQUIRED

      if (hasSignal !== lastSignalRef.current) {
        lastSignalRef.current = hasSignal
        onSignalChange?.(hasSignal)
      }

      analyser.getByteFrequencyData(frequencyData)

      const nextLevels = Array.from({ length: barCount }, (_, index) => {
        const start = Math.floor((index / barCount) * frequencyData.length)
        const end = Math.floor(((index + 1) / barCount) * frequencyData.length)
        let sum = 0
        let count = 0

        for (let i = start; i < end; i += 1) {
          sum += frequencyData[i]
          count += 1
        }

        const frequencyLevel = count > 0 ? sum / count / 255 : 0
        const barLevel = Math.max(displayLevel * 0.45, frequencyLevel * 2)
        return Math.max(0.08, Math.min(1, barLevel))
      })

      setLevels(nextLevels)
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [analyser, barCount, onSignalChange])

  return (
    <div
      className={cn(
        'flex h-16 items-end justify-center gap-[3px] px-2',
        className
      )}
      aria-hidden
    >
      {levels.map((level, index) => (
        <span
          key={index}
          className="w-[3px] rounded-full bg-gradient-to-t from-primary/70 to-violet-400 transition-[height] duration-75"
          style={{ height: `${level * 100}%` }}
        />
      ))}
    </div>
  )
}
