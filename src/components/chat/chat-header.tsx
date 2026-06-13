'use client'

import { useState } from 'react'
import { useChatStore } from '@/lib/store/chat-store'
import { Input } from '@/components/ui/input'
import { useBreakpoints } from '@/hooks/use-media-query'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createChatShareLink } from '@/lib/api/chat-share-service'
import { formatRelativeTime, cn, copyToClipboard } from '@/lib/utils'
import { PanelLeft, MoreVertical, Pencil, Share2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { OrchestrateStatusBadge } from './orchestrate-status-badge'

interface ChatHeaderProps {
  onMenuClick?: () => void
  className?: string
}

export function ChatHeader({ onMenuClick, className }: ChatHeaderProps) {
  const {
    currentSession,
    messages,
    deleteSession,
    renameSession,
    persistCurrentSession,
  } = useChatStore()
  const { isMobile, isDesktop } = useBreakpoints()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  if (!currentSession) return null

  const startRename = () => {
    setRenameDraft(currentSession.title)
    setIsRenaming(true)
  }

  const commitRename = async () => {
    const trimmed = renameDraft.trim()
    if (!trimmed) {
      toast.error('Chat name cannot be empty')
      setIsRenaming(false)
      return
    }

    if (trimmed !== currentSession.title) {
      await renameSession(currentSession.id, trimmed)
      toast.success('Chat renamed')
    }

    setIsRenaming(false)
  }

  const handleShare = async () => {
    if (messages.length === 0) {
      toast.error('Send at least one message before sharing this chat')
      return
    }

    setIsSharing(true)
    try {
      await persistCurrentSession()
      const shareUrl = await createChatShareLink(currentSession.id)

      if (navigator.share) {
        try {
          await navigator.share({
            title: currentSession.title,
            text: `View this interview practice chat: ${currentSession.title}`,
            url: shareUrl,
          })
          toast.success('Share link created')
          return
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            return
          }
        }
      }

      await copyToClipboard(shareUrl)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not share this chat'
      )
    } finally {
      setIsSharing(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${currentSession.title}"? This cannot be undone.`
    )
    if (!confirmed) return

    try {
      await deleteSession(currentSession.id)
      toast.success('Chat deleted')
    } catch {
      toast.error('Failed to delete chat. Please try again.')
    }
  }

  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b border-border/60 bg-background/80 backdrop-blur-sm shrink-0',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {!isDesktop && onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9 shrink-0 lg:hidden"
            aria-label="Open chat history"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>
        )}

        <div className="min-w-0">
          {isRenaming ? (
            <Input
              value={renameDraft}
              onChange={(event) => setRenameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void commitRename()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setIsRenaming(false)
                }
              }}
              onBlur={() => void commitRename()}
              className="h-8 w-full max-w-[min(100%,16rem)] text-sm font-semibold sm:max-w-md"
              autoFocus
              aria-label="Rename chat"
            />
          ) : (
            <h1 className="font-semibold text-sm truncate">
              {currentSession.title}
            </h1>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <OrchestrateStatusBadge />
            {!isMobile && (
              <span className="text-xs text-muted-foreground">
                Started {formatRelativeTime(currentSession.startedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <MoreVertical className="w-4 h-4" />
            <span className="sr-only">Chat options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={startRename}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void handleShare()}
            disabled={isSharing}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {isSharing ? 'Creating link...' : 'Share chat'}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
