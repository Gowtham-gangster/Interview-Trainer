'use client'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ChatHistorySidebar } from './chat-history-sidebar'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[min(100vw-2rem,300px)] border-r-0 p-0"
      >
        <ChatHistorySidebar onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
