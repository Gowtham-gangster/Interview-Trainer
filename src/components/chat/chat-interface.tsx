'use client'

import { VoiceResponseReader } from '@/components/voice/voice-response-reader'
import { useChatStore } from '@/lib/store/chat-store'
import { cn } from '@/lib/utils'

import { ChatErrorBanner } from './chat-error-banner'
import { ChatHeader } from './chat-header'
import { ChatInput } from './chat-input'
import { MessageList } from './message-list'

interface ChatInterfaceProps {
  className?: string
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const setMobileDrawerOpen = useChatStore((state) => state.setMobileDrawerOpen)

  return (
    <div
      className={cn(
        'chatgpt-surface flex h-full overflow-hidden text-foreground',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <VoiceResponseReader />
        <ChatHeader onMenuClick={() => setMobileDrawerOpen(true)} />
        <ChatErrorBanner />
        <MessageList />
        <ChatInput />
      </div>
    </div>
  )
}
