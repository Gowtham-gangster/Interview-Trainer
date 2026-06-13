'use client'

import type { VoiceConfig } from '@/lib/voice/voice-config'
import { speakText, stripMarkdownForSpeech } from '@/lib/voice/browser-speech'

let sharedAudio: HTMLAudioElement | null = null
let unlockPromise: Promise<void> | null = null
let playbackGeneration = 0

const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

export interface SpeechPlaybackSession {
  generation: number
  isCancelled: () => boolean
}

/** Unlock audio output during a user gesture (mic click) so later TTS can play. */
export function unlockSpeechPlayback(): void {
  if (typeof window === 'undefined') return

  if (!unlockPromise) {
    unlockPromise = (async () => {
      sharedAudio = sharedAudio ?? new Audio()
      sharedAudio.src = SILENT_WAV
      sharedAudio.volume = 0.001

      try {
        await sharedAudio.play()
        sharedAudio.pause()
        sharedAudio.currentTime = 0
      } catch {
        // speechSynthesis may still work as a fallback.
      }
    })()
  }
}

export function stopSpeechPlayback(): void {
  if (sharedAudio) {
    sharedAudio.pause()
    sharedAudio.currentTime = 0
    sharedAudio.removeAttribute('src')
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/** Stop any in-flight or playing TTS so a newer reply can take over. */
export function cancelSpeechPlayback(): void {
  playbackGeneration += 1
  stopSpeechPlayback()
}

/** Begin a new TTS session; cancels any previous playback. */
export function beginSpeechPlayback(): SpeechPlaybackSession {
  cancelSpeechPlayback()
  const generation = playbackGeneration
  return {
    generation,
    isCancelled: () => generation !== playbackGeneration,
  }
}

export async function playBase64Audio(
  base64: string,
  contentType: string,
  session?: SpeechPlaybackSession
): Promise<void> {
  if (session?.isCancelled()) return

  unlockSpeechPlayback()
  await unlockPromise

  if (session?.isCancelled()) return

  const audio = sharedAudio ?? new Audio()
  sharedAudio = audio
  audio.volume = 1
  audio.src = `data:${contentType};base64,${base64}`

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio.onended = null
      audio.onerror = null
    }

    audio.onended = () => {
      cleanup()
      if (session?.isCancelled()) {
        resolve()
        return
      }
      resolve()
    }

    audio.onerror = () => {
      cleanup()
      if (session?.isCancelled()) {
        resolve()
        return
      }
      reject(new Error('Audio playback failed'))
    }

    void audio.play().catch((error) => {
      cleanup()
      if (session?.isCancelled()) {
        resolve()
        return
      }
      reject(error)
    })
  })
}

export async function speakAssistantMessage(
  text: string,
  config: Pick<VoiceConfig, 'language' | 'speechRate' | 'preferredVoice'>,
  session?: SpeechPlaybackSession
): Promise<void> {
  const spokenText = stripMarkdownForSpeech(text)
  if (!spokenText || session?.isCancelled()) return

  unlockSpeechPlayback()
  await unlockPromise

  if (session?.isCancelled()) return

  try {
    const response = await fetch('/api/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: spokenText,
        language: config.language,
      }),
    })

    if (session?.isCancelled()) return

    const data = (await response.json()) as {
      audio_base64?: string
      content_type?: string
      message?: string
    }

    if (response.ok && data.audio_base64) {
      await playBase64Audio(
        data.audio_base64,
        data.content_type || 'audio/ogg',
        session
      )
      return
    }
  } catch {
    if (session?.isCancelled()) return
    // Fall through to browser speech.
  }

  if (session?.isCancelled()) return
  await speakText(spokenText, config)
}
