'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { SettingsPanel } from '@/components/settings/settings-panel'
import { SettingsRow } from '@/components/settings/settings-row'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/lib/store/chat-store'

export function ProfileDataSettings() {
  const deleteAllSessions = useChatStore((state) => state.deleteAllSessions)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAllChats = async () => {
    const confirmed = window.confirm(
      'Delete all chat history permanently? This cannot be undone.'
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const deletedCount = await deleteAllSessions()
      toast.success(
        deletedCount > 0
          ? `Deleted ${deletedCount} chat${deletedCount === 1 ? '' : 's'}`
          : 'Chat history cleared'
      )
    } catch {
      toast.error('Failed to delete chat history. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <SettingsPanel
      title="Data & Privacy"
      description="Manage your chat history stored on this account."
    >
      <SettingsRow
        title="Delete all chats"
        description="Permanently remove every conversation and message from your account."
        bordered={false}
      >
        <Button
          variant="destructive"
          size="sm"
          onClick={() => void handleDeleteAllChats()}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete all chats'}
        </Button>
      </SettingsRow>
    </SettingsPanel>
  )
}
