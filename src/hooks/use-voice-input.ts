'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useVoiceConfig } from '@/hooks/use-voice-config'
import {
  buildBrowserTranscript,
  createLiveSpeechRecognizer,
  isSpeechRecognitionSupported,
  mergeFinalSpeechChunk,
  type LiveSpeechRecognizer,
} from '@/lib/voice/browser-speech'
import { MicrophoneRecorder } from '@/lib/voice/microphone-recorder'
import { speechRecognitionLang } from '@/lib/voice/stt-language'
import {
  cancelSpeechPlayback,
  unlockSpeechPlayback,
} from '@/lib/voice/speech-playback'

export interface VoiceRecordingResult {
  duration: number
  transcript: string
  audioUrl: string | null
  mimeType: string | null
}

async function transcribeOnServer(params: {
  blob: Blob
  mimeType: string
  duration: number
  language: string
  browserTranscript: string
}): Promise<string> {
  const formData = new FormData()
  formData.append(
    'audio',
    params.blob,
    params.mimeType === 'audio/wav' ? 'recording.wav' : 'recording.webm'
  )
  formData.append('language', params.language)
  formData.append('duration_seconds', String(params.duration))
  if (params.browserTranscript) {
    formData.append('transcript', params.browserTranscript)
  }

  const response = await fetch('/api/voice/transcribe', {
    method: 'POST',
    body: formData,
  })

  const data = (await response.json()) as {
    transcript?: string
    message?: string
  }

  if (!response.ok) {
    throw new Error(data.message || 'Watson speech-to-text failed')
  }

  return data.transcript?.trim() ?? ''
}

export function useVoiceInput() {
  const { config, isVoiceEnabled } = useVoiceConfig()
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [permissionState, setPermissionState] = useState<
    'unknown' | 'granted' | 'denied'
  >('unknown')
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const recorderRef = useRef<MicrophoneRecorder | null>(null)
  const speechRecognizerRef = useRef<LiveSpeechRecognizer | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptPartsRef = useRef<string[]>([])
  const interimTranscriptRef = useRef('')

  const syncLiveTranscript = useCallback(() => {
    setLiveTranscript(
      buildBrowserTranscript(
        transcriptPartsRef.current,
        interimTranscriptRef.current
      )
    )
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopLiveRecognition = useCallback(() => {
    speechRecognizerRef.current?.stop()
    speechRecognizerRef.current = null
  }, [])

  const resetTranscripts = useCallback(() => {
    transcriptPartsRef.current = []
    interimTranscriptRef.current = ''
    setLiveTranscript('')
  }, [])

  const startLiveRecognition = useCallback(() => {
    stopLiveRecognition()

    const recognizer = createLiveSpeechRecognizer({
      language: speechRecognitionLang(config.language),
      onInterim: (text) => {
        interimTranscriptRef.current = text
        syncLiveTranscript()
      },
      onFinal: (text) => {
        transcriptPartsRef.current = mergeFinalSpeechChunk(
          transcriptPartsRef.current,
          text
        )
        interimTranscriptRef.current = ''
        syncLiveTranscript()
      },
      onError: () => {
        // Browser live preview is optional; Watson handles final transcription.
      },
    })

    if (!recognizer) return

    speechRecognizerRef.current = recognizer

    try {
      recognizer.start()
    } catch {
      // Some browsers block SpeechRecognition while MediaRecorder is active.
    }
  }, [config.language, stopLiveRecognition, syncLiveTranscript])

  const requestMicrophoneAccess = useCallback(async () => {
    const recorder = new MicrophoneRecorder(config.microphoneDeviceId)
    await recorder.requestAccess()
    recorder.dispose()
    setPermissionState('granted')
    toast.success('Microphone access granted')
  }, [config.microphoneDeviceId])

  const startRecording = useCallback(async () => {
    if (!isVoiceEnabled) {
      toast.info('Enable voice input in Profile → Voice.')
      return
    }

    try {
      cancelSpeechPlayback()
      unlockSpeechPlayback()
      resetTranscripts()
      setElapsed(0)
      setIsProcessing(false)

      const recorder = new MicrophoneRecorder(config.microphoneDeviceId)
      recorderRef.current = recorder
      await recorder.start()
      setAnalyser(recorder.getAnalyser())
      setPermissionState('granted')
      setIsRecording(true)
      startLiveRecognition()

      timerRef.current = setInterval(() => {
        setElapsed((value) => value + 1)
      }, 1000)
    } catch (error) {
      stopLiveRecognition()
      setPermissionState('denied')
      setIsRecording(false)
      clearTimer()
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not access the microphone.'
      )
    }
  }, [
    clearTimer,
    config.microphoneDeviceId,
    isVoiceEnabled,
    resetTranscripts,
    startLiveRecognition,
    stopLiveRecognition,
  ])

  const stopRecording = useCallback(async (): Promise<VoiceRecordingResult | null> => {
    if (!recorderRef.current) return null

    clearTimer()
    stopLiveRecognition()
    setAnalyser(null)
    setIsRecording(false)
    setIsProcessing(true)

    const browserTranscript = buildBrowserTranscript(
      transcriptPartsRef.current,
      interimTranscriptRef.current
    )

    await new Promise((resolve) => setTimeout(resolve, 200))

    try {
      const { blob, duration, mimeType } = await recorderRef.current.stop()
      recorderRef.current = null

      let transcript = browserTranscript

      try {
        const watsonTranscript = await transcribeOnServer({
          blob,
          mimeType,
          duration,
          language: config.language,
          browserTranscript,
        })
        if (watsonTranscript) {
          transcript = watsonTranscript
        }
      } catch (error) {
        if (browserTranscript) {
          transcript = browserTranscript
          toast.message('Used browser transcript', {
            description:
              error instanceof Error
                ? error.message
                : 'Watson could not transcribe this recording.',
          })
        } else {
          throw error
        }
      }

      const audioUrl = URL.createObjectURL(blob)

      if (!transcript) {
        toast.error(
          'No speech was detected. Speak for at least 2 seconds, then try again.'
        )
      }

      return {
        duration,
        transcript,
        audioUrl,
        mimeType,
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to process recording.'
      )
      return null
    } finally {
      setIsProcessing(false)
      interimTranscriptRef.current = ''
      setLiveTranscript('')
    }
  }, [clearTimer, config.language, stopLiveRecognition])

  const cancelRecording = useCallback(() => {
    clearTimer()
    stopLiveRecognition()
    setAnalyser(null)
    recorderRef.current?.dispose()
    recorderRef.current = null
    setIsRecording(false)
    setIsProcessing(false)
    resetTranscripts()
    setElapsed(0)
  }, [clearTimer, resetTranscripts, stopLiveRecognition])

  useEffect(() => {
    return () => {
      clearTimer()
      stopLiveRecognition()
      setAnalyser(null)
      recorderRef.current?.dispose()
    }
  }, [clearTimer, stopLiveRecognition])

  return {
    isRecording,
    isProcessing,
    elapsed,
    liveTranscript,
    permissionState,
    isVoiceEnabled,
    speechRecognitionSupported: isSpeechRecognitionSupported(),
    analyser,
    requestMicrophoneAccess,
    startRecording,
    stopRecording,
    cancelRecording,
    resetTranscripts,
  }
}
