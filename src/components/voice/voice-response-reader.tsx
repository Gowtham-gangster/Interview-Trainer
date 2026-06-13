'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useVoiceConfig } from '@/hooks/use-voice-config'
import { useChatStore } from '@/lib/store/chat-store'
import {
  beginSpeechPlayback,
  cancelSpeechPlayback,
  speakAssistantMessage,
} from '@/lib/voice/speech-playback'

export function VoiceResponseReader() {
  const { config, isVoiceEnabled } = useVoiceConfig()
  const {
    messages,
    isStreaming,
    pendingVoiceReply,
    setPendingVoiceReply,
    voiceChatActive,
    setIsSpeakingResponse,
  } = useChatStore()
  const lastSpokenIdRef = useRef<string | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (isStreaming) {
      cancelSpeechPlayback()
      setIsSpeakingResponse(false)
    }
  }, [isStreaming, setIsSpeakingResponse])

  useEffect(() => {
    if (
      !voiceChatActive &&
      !pendingVoiceReply &&
      !config.speakResponses
    ) {
      cancelSpeechPlayback()
      setIsSpeakingResponse(false)
    }
  }, [
    config.speakResponses,
    pendingVoiceReply,
    setIsSpeakingResponse,
    voiceChatActive,
  ])

  useEffect(() => {
    const shouldSpeak =
      isVoiceEnabled &&
      (voiceChatActive || config.speakResponses || pendingVoiceReply)

    if (!shouldSpeak || isStreaming) return

    const lastAssistant = [...messages]
      .reverse()
      .find((message) => message.role === 'assistant')

    if (!lastAssistant?.content.trim()) return

    if (!initializedRef.current) {
      lastSpokenIdRef.current = lastAssistant.id
      initializedRef.current = true
      return
    }

    if (lastAssistant.id === lastSpokenIdRef.current) return

    const session = beginSpeechPlayback()
    lastSpokenIdRef.current = lastAssistant.id
    setIsSpeakingResponse(true)

    void speakAssistantMessage(lastAssistant.content, config, session)
      .catch(() => {
        if (!session.isCancelled()) {
          toast.error(
            'Could not play the spoken reply. Check Profile → Voice settings.'
          )
        }
      })
      .finally(() => {
        if (!session.isCancelled()) {
          setIsSpeakingResponse(false)
          if (pendingVoiceReply) {
            setPendingVoiceReply(false)
          }
        }
      })
  }, [
    config,
    isStreaming,
    isVoiceEnabled,
    messages,
    pendingVoiceReply,
    setIsSpeakingResponse,
    setPendingVoiceReply,
    voiceChatActive,
  ])

  return null
}
