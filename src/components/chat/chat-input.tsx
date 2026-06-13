'use client'

import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useChatStore } from '@/lib/store/chat-store'
import { useBreakpoints } from '@/hooks/use-media-query'
import { cn, formatBytes } from '@/lib/utils'
import { VoiceInteractionPanel } from '@/components/voice'
import { useVoiceConfig } from '@/hooks/use-voice-config'
import type { VoiceRecordingResult } from '@/hooks/use-voice-input'
import {
  cancelSpeechPlayback,
  unlockSpeechPlayback,
} from '@/lib/voice/speech-playback'
import {
  Send,
  Mic,
  FileUp,
  X,
  FileText,
} from 'lucide-react'

interface ChatInputProps {
  className?: string
}

const ACCEPTED_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export function ChatInput({ className }: ChatInputProps) {
  const {
    inputValue,
    setInputValue,
    sendMessage,
    setPendingVoiceReply,
    setVoiceChatActive,
    setIsSpeakingResponse,
    voiceChatActive,
    isLoading,
    isStreaming,
    currentSession,
    uploadedResume,
    setUploadedResume,
  } = useChatStore()

  const { isMobile } = useBreakpoints()
  const { config: voiceConfig } = useVoiceConfig()
  const [voicePanelOpen, setVoicePanelOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const disabled = isLoading || isStreaming || isRecording
  const canSend = inputValue.trim().length > 0 && !disabled

  const closeVoiceChat = useCallback(() => {
    cancelSpeechPlayback()
    setPendingVoiceReply(false)
    setIsSpeakingResponse(false)
    setVoiceChatActive(false)
    setVoicePanelOpen(false)
    setIsRecording(false)
  }, [
    setIsSpeakingResponse,
    setPendingVoiceReply,
    setVoiceChatActive,
  ])

  const handleSend = async () => {
    if (!canSend || !currentSession) return
    if (voiceChatActive) {
      cancelSpeechPlayback()
      setPendingVoiceReply(true)
    }
    await sendMessage(inputValue.trim())
    resetTextareaHeight()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 200
      textareaRef.current.style.height =
        Math.min(scrollHeight, maxHeight) + 'px'
    }
  }

  const handleVoiceToggle = () => {
    if (!voiceConfig.enabled) {
      alert('Voice input is disabled. Enable it in Profile → Voice.')
      return
    }

    if (voicePanelOpen) {
      closeVoiceChat()
      return
    }

    unlockSpeechPlayback()
    setVoicePanelOpen(true)
    setVoiceChatActive(true)
  }

  const handleRecordingComplete = async (recording: VoiceRecordingResult) => {
    setIsRecording(false)

    const transcript = recording.transcript.trim()
    if (!transcript) return

    if (recording.audioUrl) {
      URL.revokeObjectURL(recording.audioUrl)
    }

    if (voiceConfig.autoSend) {
      cancelSpeechPlayback()
      setPendingVoiceReply(true)
      await sendMessage(transcript)
      return
    }

    setInputValue(transcript)
  }

  const handleResumeUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
      alert('Please upload a PDF, DOC, DOCX, or TXT file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB.')
      return
    }

    setUploadedResume(file)
    e.target.value = ''
  }

  const removeResume = () => {
    setUploadedResume(null)
  }

  if (!currentSession) return null

  return (
    <div
      className={cn(
        'border-t border-border/60 bg-background/80 pb-safe backdrop-blur-sm',
        className
      )}
    >
      <div className="mx-auto max-w-3xl px-3 py-3 sm:px-4 sm:py-4">
        {/* Resume attachment badge */}
        {uploadedResume && (
          <div className="mb-3 flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
              <FileText className="w-4 h-4 text-primary" />
              <span className="max-w-[120px] truncate sm:max-w-[200px]">
                {uploadedResume.name}
              </span>
              <span className="text-xs text-muted-foreground">
                ({formatBytes(uploadedResume.size)})
              </span>
              <button
                onClick={removeResume}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <VoiceInteractionPanel
            open={voicePanelOpen}
            autoSubmitOnComplete={voiceConfig.autoSend}
            onClose={closeVoiceChat}
            onRecordingStateChange={setIsRecording}
            onRecordingComplete={handleRecordingComplete}
          />

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleResumeUpload}
          className="hidden"
        />

        {/* Input container: upload | message | mic | send */}
        <div
          className={cn(
            'relative flex items-end gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm sm:gap-2 sm:p-2',
            'focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40',
            (isRecording || voicePanelOpen) && 'border-primary/40 ring-2 ring-primary/10',
            isRecording && 'border-red-300 dark:border-red-800'
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Upload resume"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground sm:h-10 sm:w-10"
          >
            <FileUp className="h-4 w-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening...'
                : isMobile
                  ? 'Message AI Interviewer...'
                  : 'Message AI Interviewer... (Enter to send, Shift+Enter for new line)'
            }
            disabled={disabled}
            className={cn(
              'min-h-[40px] min-w-0 max-h-[200px] flex-1 resize-none border-0 bg-transparent px-1 py-2.5',
              'text-sm leading-5 focus-visible:ring-0 focus-visible:ring-offset-0',
              'placeholder:text-muted-foreground/60 sm:min-h-[44px] sm:px-2 sm:py-3'
            )}
            rows={1}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceToggle}
            disabled={isLoading || isStreaming}
            title={voicePanelOpen ? 'Close voice input' : 'Voice input'}
            className={cn(
              'h-9 w-9 shrink-0 sm:h-10 sm:w-10',
              voicePanelOpen || isRecording
                ? 'bg-primary/10 text-primary hover:bg-primary/15'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Mic className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="icon"
            title="Send message"
            className={cn(
              'h-9 w-9 shrink-0 rounded-xl sm:h-10 sm:w-10',
              canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        </div>
      </div>
    </div>
  )
}
