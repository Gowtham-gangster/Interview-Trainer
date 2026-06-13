import dynamic from 'next/dynamic'
import { Metadata } from 'next'

import { ChatSkeleton } from '@/components/common/skeletons/chat-skeleton'

const ChatSessionInitializer = dynamic(() =>
  import('@/components/chat/chat-session-initializer').then(
    (mod) => mod.ChatSessionInitializer
  )
)

const ChatInterface = dynamic(
  () =>
    import('@/components/chat/chat-interface').then((mod) => mod.ChatInterface),
  {
    loading: () => <ChatSkeleton />,
  }
)

export const metadata: Metadata = {
  title: 'AI Chat | AI Interview Trainer',
  description: 'Practice interviews with AI in a ChatGPT-style interface',
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; session?: string }>
}) {
  const params = await searchParams

  return (
    <>
      <ChatSessionInitializer
        sessionType={params.type}
        initialSessionId={params.session}
      />
      <ChatInterface className="h-full w-full" />
    </>
  )
}
