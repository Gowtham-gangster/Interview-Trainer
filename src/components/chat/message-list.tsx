'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { useChatStore } from '@/lib/store/chat-store'
import { MessageItem } from './message-item'
import { TypingIndicator } from './typing-indicator'
import { ChatEmptyState } from './chat-empty-state'
import { cn } from '@/lib/utils'

interface MessageListProps {
  className?: string
}

export function MessageList({ className }: MessageListProps) {
  const messages = useChatStore((state) => state.messages)
  const isTyping = useChatStore((state) => state.isTyping)
  const currentSession = useChatStore((state) => state.currentSession)
  const isStreaming = useChatStore((state) => state.isStreaming)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const nearBottom = distanceFromBottom < 100
    shouldAutoScroll.current = nearBottom
    setShowScrollButton(!nearBottom && messages.length > 0)
  }, [messages.length])

  const handleScrollToBottom = useCallback(() => {
    shouldAutoScroll.current = true
    setShowScrollButton(false)
    scrollToBottom('smooth')
  }, [scrollToBottom])

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight
      const nearBottom = distanceFromBottom < 100
      setShowScrollButton(!nearBottom && messages.length > 0)
    }

    if (shouldAutoScroll.current) {
      scrollToBottom(isStreaming ? 'auto' : 'smooth')
    }
  }, [messages, isTyping, isStreaming, scrollToBottom])

  if (!currentSession) {
    return <ChatEmptyState />
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          'h-full overflow-y-auto chatgpt-scrollbar',
          className
        )}
      >
        {messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <div className="space-y-1 pb-4 pt-2">
            {messages.map((message, index) => (
              <MessageItem
                key={message.id}
                message={message}
                isLastMessage={index === messages.length - 1}
              />
            ))}

            {isTyping && !isStreaming && <TypingIndicator />}

            <div ref={messagesEndRef} className="h-px" />
          </div>
        )}
      </div>

      {showScrollButton && (
        <button
          type="button"
          onClick={handleScrollToBottom}
          aria-label="Scroll to bottom"
          className="absolute bottom-4 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition-all hover:bg-muted hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
