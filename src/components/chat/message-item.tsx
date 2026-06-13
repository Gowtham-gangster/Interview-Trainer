'use client'

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarkdownRenderer } from './markdown-renderer'
import { formatRelativeTime, copyToClipboard, cn } from '@/lib/utils'
import { useChatStore } from '@/lib/store/chat-store'
import { fadeInUp } from '@/lib/motion/variants'
import type { Message } from '@/types'
import {
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Star,
} from 'lucide-react'

interface MessageItemProps {
  message: Message
  isLastMessage?: boolean
  className?: string
  readOnly?: boolean
}

export const MessageItem = memo(function MessageItem({
  message,
  isLastMessage,
  className,
  readOnly = false,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false)
  const streamingMessageId = useChatStore((state) => state.streamingMessageId)
  const isStreaming = useChatStore((state) => state.isStreaming)
  const retryMessage = useChatStore((state) => state.retryMessage)

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isSystem = message.role === 'system'
  const isCurrentlyStreaming =
    isStreaming && streamingMessageId === message.id

  const handleCopy = async () => {
    try {
      await copyToClipboard(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  if (isSystem) {
    return (
      <div className={cn('flex justify-center px-4 py-2', className)}>
        <div className="max-w-md rounded-full bg-muted/60 px-4 py-1.5 text-center text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={cn(
        'group px-3 py-3 sm:px-4',
        isAssistant && 'bg-muted/30',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-3xl gap-3',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
          <AvatarFallback
            className={cn(
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-emerald-600 text-white'
            )}
          >
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>

        <div
          className={cn(
            'min-w-0 flex flex-col gap-1.5',
            isUser ? 'items-end max-w-[85%]' : 'items-start max-w-[90%]'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-2 text-xs text-muted-foreground',
              isUser && 'flex-row-reverse'
            )}
          >
            <span className="font-medium text-foreground/80">
              {isUser ? 'You' : 'AI Interviewer'}
            </span>
            <span>{formatRelativeTime(message.timestamp)}</span>
            {message.metadata?.questionType && (
              <Badge variant="outline" className="h-5 text-xs">
                {message.metadata.questionType}
              </Badge>
            )}
            {message.metadata?.difficulty && (
              <Badge
                variant="outline"
                className={cn(
                  'h-5 text-xs',
                  message.metadata.difficulty === 'easy' &&
                    'border-green-200 text-green-600',
                  message.metadata.difficulty === 'medium' &&
                    'border-yellow-200 text-yellow-600',
                  message.metadata.difficulty === 'hard' &&
                    'border-red-200 text-red-600'
                )}
              >
                {message.metadata.difficulty}
              </Badge>
            )}
          </div>

          <div
            className={cn(
              'text-[15px] leading-relaxed',
              isUser
                ? 'rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-primary-foreground shadow-sm'
                : 'w-full'
            )}
          >
            {isAssistant ? (
              <MarkdownRenderer
                content={message.content}
                isStreaming={isCurrentlyStreaming}
              />
            ) : (
              <p className="whitespace-pre-wrap text-left">{message.content}</p>
            )}
          </div>

          {message.metadata?.score && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-yellow-500" />
              <span>Score: {message.metadata.score}/10</span>
            </div>
          )}

          {message.metadata?.feedback && (
            <div className="mt-1 max-w-full rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <div className="mb-1 font-medium">Feedback</div>
              <div>{message.metadata.feedback}</div>
            </div>
          )}

          {!readOnly && !isCurrentlyStreaming && message.content && (
            <div
              className={cn(
                'flex items-center gap-1 pt-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100',
                isUser && 'flex-row-reverse'
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-muted-foreground"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>

              {isAssistant && isLastMessage && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => retryMessage(message.id)}
                    className="h-7 px-2 text-muted-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
})
