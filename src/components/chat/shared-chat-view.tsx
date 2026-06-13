'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { MessageItem } from '@/components/chat/message-item'
import { Button } from '@/components/ui/button'
import { fetchChatSessions } from '@/lib/api/chat-session-service'
import {
  fetchSharedChat,
  importSharedChat,
  type SharedChatPayload,
} from '@/lib/api/chat-share-service'
import { useChatStore } from '@/lib/store/chat-store'
import { cn } from '@/lib/utils'

interface SharedChatViewProps {
  shareToken: string
}

export function SharedChatView({ shareToken }: SharedChatViewProps) {
  const router = useRouter()
  const [sharedChat, setSharedChat] = useState<SharedChatPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const data = await fetchSharedChat(shareToken)
        if (!cancelled) {
          setSharedChat(data)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load shared chat'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [shareToken])

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const imported = await importSharedChat(shareToken)
      const { sessions } = await fetchChatSessions()
      const { hydrateSessions, selectSession } = useChatStore.getState()
      hydrateSessions(sessions)
      selectSession(imported.sessionId)
      toast.success('Chat saved to your account')
      router.push('/chat')
    } catch (importError) {
      toast.error(
        importError instanceof Error
          ? importError.message
          : 'Failed to save shared chat'
      )
    } finally {
      setIsImporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !sharedChat) {
    return (
      <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-muted-foreground">
          {error ?? 'This shared chat could not be found.'}
        </p>
        <Button asChild variant="outline">
          <Link href="/chat">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to chat
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Shared chat
            </p>
            <h1 className="truncate text-lg font-semibold">{sharedChat.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Shared by {sharedChat.sharedBy.name} · {sharedChat.messages.length}{' '}
              message{sharedChat.messages.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/chat">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {!sharedChat.isOwner && (
              <Button
                size="sm"
                onClick={() => void handleImport()}
                disabled={isImporting}
              >
                {isImporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Save to my chats
              </Button>
            )}
            {sharedChat.isOwner && (
              <Button asChild size="sm">
                <Link href={`/chat?session=${encodeURIComponent(sharedChat.sessionId)}`}>
                  Open chat
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4">
          <div className={cn('space-y-1')}>
            {sharedChat.messages.map((message, index) => (
              <MessageItem
                key={message.id}
                message={message}
                isLastMessage={index === sharedChat.messages.length - 1}
                readOnly
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
