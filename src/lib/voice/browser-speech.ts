'use client'

import type { VoiceConfig } from '@/lib/voice/voice-config'

type SpeechRecognitionCtor = new () => SpeechRecognition

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(getSpeechRecognitionCtor())
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null
}

export interface LiveSpeechRecognizer {
  start: () => void
  stop: () => void
  abort: () => void
}

/** Chrome often emits cumulative final chunks; merge without duplicating words. */
export function mergeFinalSpeechChunk(parts: string[], chunk: string): string[] {
  const text = chunk.trim()
  if (!text) return parts

  if (parts.length === 0) return [text]

  const last = parts[parts.length - 1]
  if (text === last) return parts
  if (text.startsWith(last)) return [...parts.slice(0, -1), text]
  if (last.startsWith(text)) return parts

  return [...parts, text]
}

export function buildBrowserTranscript(parts: string[], interim = ''): string {
  const merged = interim.trim() ? [...parts, interim.trim()] : parts
  return merged.join(' ').trim()
}

export function createLiveSpeechRecognizer(options: {
  language: string
  onInterim: (text: string) => void
  onFinal: (text: string) => void
  onError: (message: string) => void
}): LiveSpeechRecognizer | null {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) return null

  const recognition = new Ctor()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = options.language

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interim = ''
    let finalChunk = ''

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i]
      const text = result[0]?.transcript ?? ''
      if (result.isFinal) {
        finalChunk += text
      } else {
        interim += text
      }
    }

    if (interim.trim()) options.onInterim(interim.trim())
    if (finalChunk.trim()) options.onFinal(finalChunk.trim())
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === 'aborted' || event.error === 'no-speech') return
    options.onError(event.error)
  }

  let active = false

  recognition.onend = () => {
    if (active) {
      try {
        recognition.start()
      } catch {
        // Chrome may throw if start is called too quickly after end.
      }
    }
  }

  return {
    start: () => {
      active = true
      recognition.start()
    },
    stop: () => {
      active = false
      recognition.stop()
    },
    abort: () => {
      active = false
      recognition.abort()
    },
  }
}

export function listSpeechVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return []
  return window.speechSynthesis.getVoices()
}

export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

let activeUtterance: SpeechSynthesisUtterance | null = null

export function speakText(
  text: string,
  config: Pick<VoiceConfig, 'language' | 'speechRate' | 'preferredVoice'>
): Promise<void> {
  if (!isSpeechSynthesisSupported() || !text.trim()) {
    return Promise.resolve()
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = config.language
  utterance.rate = config.speechRate

  const voices = listSpeechVoices()
  const preferred = config.preferredVoice
    ? voices.find((voice) => voice.name === config.preferredVoice)
    : voices.find((voice) => voice.lang.startsWith(config.language.split('-')[0]))

  if (preferred) utterance.voice = preferred

  activeUtterance = utterance

  return new Promise<void>((resolve, reject) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('Browser speech failed'))
    window.speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking() {
  if (!isSpeechSynthesisSupported()) return
  window.speechSynthesis.cancel()
  activeUtterance = null
}
