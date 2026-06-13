import { Metadata } from 'next'

import { SharedChatView } from '@/components/chat/shared-chat-view'

export const metadata: Metadata = {
  title: 'Shared Chat | AI Interview Trainer',
  description: 'View a shared interview practice chat',
}

type SharedChatPageProps = {
  params: Promise<{ token: string }>
}

export default async function SharedChatPage({ params }: SharedChatPageProps) {
  const { token } = await params

  return <SharedChatView shareToken={token} />
}
