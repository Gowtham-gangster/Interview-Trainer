'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useVoiceInput, type VoiceRecordingResult } from '@/hooks/use-voice-input'
import { useVoiceConfig } from '@/hooks/use-voice-config'
import { useChatStore } from '@/lib/store/chat-store'
import { cn } from '@/lib/utils'
import { VOICE_LANGUAGE_OPTIONS } from '@/lib/voice/voice-config'

import { LiveAudioWaveform } from './live-audio-waveform'
import { VoiceMicrophoneButton } from './voice-microphone-button'
import { VoicePlayback } from './voice-playback'
type VoicePhase = 'idle' | 'recording' | 'processing' | 'recorded' | 'playing'

interface VoiceInteractionPanelProps {
  open: boolean
  onClose: () => void
  onRecordingComplete?: (recording: VoiceRecordingResult) => Promise<void> | void
  onRecordingStateChange?: (isRecording: boolean) => void
  autoSubmitOnComplete?: boolean
  className?: string
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function VoiceInteractionPanel({
  open,
  onClose,
  onRecordingComplete,
  onRecordingStateChange,
  autoSubmitOnComplete = true,
  className,
}: VoiceInteractionPanelProps) {
  const { config } = useVoiceConfig()
  const isSpeakingResponse = useChatStore((state) => state.isSpeakingResponse)
  const {
    isRecording,
    isProcessing,
    elapsed,
    liveTranscript,
    permissionState,
    isVoiceEnabled,
    analyser,
    requestMicrophoneAccess,
    startRecording,
    stopRecording,
    cancelRecording,
    resetTranscripts,
  } = useVoiceInput()

  const [phase, setPhase] = useState<VoicePhase>('idle')
  const [recording, setRecording] = useState<VoiceRecordingResult | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [hasMicSignal, setHasMicSignal] = useState(false)

  const resetState = useCallback(() => {
    cancelRecording()
    setPhase('idle')
    setRecording(null)
    setIsPlaying(false)
    setPlaybackProgress(0)
    resetTranscripts()
  }, [cancelRecording, resetTranscripts])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  const handleStartRecording = useCallback(async () => {
    if (!isVoiceEnabled) {
      toast.info('Enable voice input in Profile → Voice.')
      return
    }

    setRecording(null)
    setPlaybackProgress(0)
    setHasMicSignal(false)
    setPhase('recording')
    onRecordingStateChange?.(true)
    await startRecording()
  }, [isVoiceEnabled, onRecordingStateChange, startRecording])

  const handleStopRecording = useCallback(async () => {
    onRecordingStateChange?.(false)
    const result = await stopRecording()

    if (!result) {
      setPhase('idle')
      return
    }

    if (autoSubmitOnComplete && onRecordingComplete) {
      setPhase('processing')
      await onRecordingComplete(result)
      if (result.audioUrl) URL.revokeObjectURL(result.audioUrl)
      setRecording(null)
      setPhase('idle')
      resetTranscripts()
      return
    }

    setRecording(result)
    setPhase('recorded')
    await onRecordingComplete?.(result)
  }, [
    autoSubmitOnComplete,
    onRecordingComplete,
    onRecordingStateChange,
    resetTranscripts,
    stopRecording,
  ])

  const handleDeleteRecording = useCallback(() => {
    if (recording?.audioUrl) {
      URL.revokeObjectURL(recording.audioUrl)
    }
    resetState()
  }, [recording?.audioUrl, resetState])

  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open, resetState])

  useEffect(() => {
    onRecordingStateChange?.(isRecording)
  }, [isRecording, onRecordingStateChange])

  if (!open) return null

  const languageLabel =
    VOICE_LANGUAGE_OPTIONS.find((option) => option.value === config.language)
      ?.label ?? config.language

  const statusLabel = isSpeakingResponse
    ? 'Speaking reply…'
    : isProcessing || phase === 'processing'
    ? 'Processing…'
    : phase === 'recording' || isRecording
      ? 'Recording…'
      : phase === 'playing'
        ? 'Playing back'
        : phase === 'recorded'
          ? 'Recording ready'
          : 'Tap to start'

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-full z-20 mb-3 animate-in fade-in slide-in-from-bottom-4 duration-300',
        className,
      )}
    >
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-xl backdrop-blur-md">
        <div className="relative border-b border-border/50 bg-gradient-to-br from-primary/5 via-background to-violet-500/5 px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute right-3 top-3 h-8 w-8 rounded-full text-muted-foreground"
            aria-label="Close voice panel"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="pr-10">
            <p className="text-sm font-semibold">Voice Input</p>
            <p className="text-xs text-muted-foreground">
              Speak clearly in {languageLabel}. Audio is recorded and sent to IBM Watson
              Speech to Text.
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-6">
          {permissionState === 'denied' && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Microphone access is blocked. Allow microphone permission in your browser, then try again.
            </div>
          )}

          {!isVoiceEnabled && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              Voice input is disabled. Turn it on in Profile → Voice.
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium tabular-nums transition-colors',
                phase === 'recording' || isRecording
                  ? 'bg-red-500/10 text-red-500'
                  : isPlaying
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {(phase === 'recording' || isRecording) && (
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 align-middle" />
              )}
              {statusLabel}
              {(phase === 'recording' || isRecording || recording) && (
                <span className="ml-2 font-semibold">
                  {phase === 'recording' || isRecording
                    ? formatTime(elapsed)
                    : recording
                      ? formatTime(recording.duration)
                      : ''}
                </span>
              )}
            </div>

            {(phase === 'recording' || isRecording) && (
              <div className="w-full space-y-2">
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <LiveAudioWaveform
                    analyser={analyser}
                    barCount={36}
                    onSignalChange={setHasMicSignal}
                  />
                </div>
                {!hasMicSignal && elapsed >= 4 && (
                  <p className="text-center text-xs text-amber-600 dark:text-amber-400">
                    No microphone signal detected. Choose the correct input device in Profile →
                    Voice, then check system sound settings and browser permissions.
                  </p>
                )}
                {liveTranscript && (
                  <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
                    {liveTranscript}
                  </p>
                )}
              </div>
            )}

            {(phase === 'idle' || phase === 'recording' || isRecording) && (
              <VoiceMicrophoneButton
                isRecording={phase === 'recording' || isRecording}
                onStart={handleStartRecording}
                onStop={handleStopRecording}
                disabled={isProcessing || !isVoiceEnabled}
              />
            )}

            {phase === 'idle' && !isRecording && (
              <div className="space-y-2 text-center">
                <p className="text-xs text-muted-foreground">
                  Press the microphone to begin your answer
                </p>
                {permissionState !== 'granted' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => void requestMicrophoneAccess()}
                  >
                    Allow microphone access
                  </Button>
                )}
              </div>
            )}

            {(phase === 'recording' || isRecording) && (
              <p className="text-center text-xs text-muted-foreground">
                {autoSubmitOnComplete
                  ? 'Speak for at least 2 seconds, then press stop to send and hear the reply'
                  : 'Speak for at least 2 seconds, then press stop'}
              </p>
            )}

            {phase === 'processing' && !isSpeakingResponse && (
              <p className="text-center text-xs text-muted-foreground">
                Sending your message and preparing a spoken reply…
              </p>
            )}

            {isSpeakingResponse && (
              <p className="text-center text-xs text-primary">
                AI is speaking. Tap the microphone anytime to ask your next question — the
                latest reply will be spoken.
              </p>
            )}
          </div>

          {recording && (phase === 'recorded' || phase === 'playing') && (
            <>
              {recording.transcript && (
                <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                  {recording.transcript}
                </p>
              )}

              <VoicePlayback
                duration={recording.duration}
                audioUrl={recording.audioUrl}
                isPlaying={isPlaying}
                progress={playbackProgress}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onReset={() => {
                  setIsPlaying(false)
                  setPlaybackProgress(0)
                }}
                onDelete={handleDeleteRecording}
              />
            </>
          )}

          {recording && phase === 'recorded' && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  if (recording.audioUrl) URL.revokeObjectURL(recording.audioUrl)
                  setRecording(null)
                  setPhase('idle')
                  resetTranscripts()
                }}
              >
                Record again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
