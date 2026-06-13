'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppData } from '@/hooks/use-app-data'
import { useChatStore } from '@/lib/store/chat-store'
import { cn } from '@/lib/utils'
import {
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  Sparkles,
  MoreHorizontal,
  Pencil,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChatHistorySidebarProps {
  className?: string
  onClose?: () => void
}

export function ChatHistorySidebar({ className, onClose }: ChatHistorySidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { data: appData } = useAppData()
  const {
    sessions,
    currentSession,
    createNewChat,
    selectSession,
    deleteSession,
    renameSession,
    toggleSidebar,
  } = useChatStore()

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  const goToChat = () => {
    if (pathname !== '/chat') {
      router.push('/chat')
    }
  }

  const handleNewChat = () => {
    createNewChat()
    goToChat()
  }

  const handleSelect = (id: string) => {
    if (renamingId) return
    selectSession(id)
    goToChat()
  }

  const startRename = (sessionId: string, currentTitle: string) => {
    setOpenMenuId(null)
    setRenamingId(sessionId)
    setRenameDraft(currentTitle)
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameDraft('')
  }

  const commitRename = async (sessionId: string) => {
    const trimmed = renameDraft.trim()
    const original =
      sessions.find((item) => item.id === sessionId)?.title ?? ''

    if (!trimmed) {
      toast.error('Chat name cannot be empty')
      cancelRename()
      return
    }

    if (trimmed === original) {
      cancelRename()
      return
    }

    await renameSession(sessionId, trimmed)
    cancelRename()
    toast.success('Chat renamed')
  }

  const userName = appData?.profile.name ?? session?.user?.name ?? 'User'
  const userInitials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r border-border bg-card text-card-foreground',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border p-3">
        <button
          type="button"
          tabIndex={-1}
          aria-label="AI Interview Trainer Agent"
          className="cursor-default px-1"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose ?? toggleSidebar}
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3">
        <Button
          onClick={handleNewChat}
          className="h-10 w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="px-4 pb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Chat History
        </p>
      </div>

      <ScrollArea className="flex-1 px-2 chatgpt-scrollbar">
        <div className="space-y-0.5 pb-4">
          {sessions.map((sessionItem) => {
            const isActive = currentSession?.id === sessionItem.id
            const isRenaming = renamingId === sessionItem.id
            const isMenuOpen = openMenuId === sessionItem.id

            return (
              <div
                key={sessionItem.id}
                className={cn(
                  'group flex items-start gap-0.5 rounded-lg',
                  isActive && 'bg-primary/10'
                )}
              >
                {isRenaming ? (
                  <div className="min-w-0 flex-1 px-3 py-2.5">
                    <Input
                      ref={renameInputRef}
                      value={renameDraft}
                      onChange={(event) => setRenameDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void commitRename(sessionItem.id)
                        }
                        if (event.key === 'Escape') {
                          event.preventDefault()
                          cancelRename()
                        }
                      }}
                      onBlur={() => {
                        void commitRename(sessionItem.id)
                      }}
                      className="h-8 text-sm"
                      aria-label="Rename chat"
                    />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSelect(sessionItem.id)}
                      className={cn(
                        'min-w-0 flex-1 rounded-lg px-3 py-2 text-left transition-colors',
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                        <p className="min-w-0 flex-1 truncate text-sm font-medium leading-tight">
                          {sessionItem.title}
                        </p>
                      </div>
                    </button>

                    <DropdownMenu
                      open={isMenuOpen}
                      onOpenChange={(open) =>
                        setOpenMenuId(open ? sessionItem.id : null)
                      }
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-7 w-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground',
                            isActive || isMenuOpen
                              ? 'opacity-100'
                              : 'opacity-100 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                          )}
                          onClick={(event) => event.stopPropagation()}
                          onPointerDown={(event) => event.stopPropagation()}
                          aria-label="Chat options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50 w-40">
                        <DropdownMenuItem
                          onSelect={() =>
                            startRename(sessionItem.id, sessionItem.title)
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => {
                            void (async () => {
                              const confirmed = window.confirm(
                                `Delete "${sessionItem.title}"? This cannot be undone.`
                              )
                              if (!confirmed) return

                              try {
                                await deleteSession(sessionItem.id)
                                toast.success('Chat deleted')
                              } catch {
                                toast.error('Failed to delete chat. Please try again.')
                              }
                            })()
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3">
        <Link
          href="/profile"
          prefetch={true}
          onMouseEnter={() => router.prefetch('/profile')}
          className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-semibold text-white">
            {userInitials || 'U'}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{userName}</p>
        </Link>
      </div>
    </div>
  )
}
