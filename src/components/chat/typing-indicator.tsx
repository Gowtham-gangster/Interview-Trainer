'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        'animate-fade-in bg-muted/30 px-4 py-3',
        className
      )}
    >
      <div className="mx-auto flex max-w-3xl gap-3">
        <Avatar className="mt-0.5 h-8 w-8 shrink-0">
          <AvatarFallback className="bg-emerald-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground/80">
            AI Interviewer
          </span>
          <div className="flex items-center gap-1.5 py-1">
            <span className="h-2 w-2 animate-typing rounded-full bg-muted-foreground/60" />
            <span className="animation-delay-200 h-2 w-2 animate-typing rounded-full bg-muted-foreground/60" />
            <span className="animation-delay-400 h-2 w-2 animate-typing rounded-full bg-muted-foreground/60" />
          </div>
        </div>
      </div>
    </div>
  )
}
