'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { PanelLeft } from 'lucide-react'

import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar'
import { MobileSidebar } from '@/components/chat/mobile-sidebar'
import { Header } from '@/components/layout/header'
import { PageTransition } from '@/components/motion/page-transition'
import { Button } from '@/components/ui/button'
import { userDataQueryKey } from '@/hooks/use-app-data'
import { useBreakpoints } from '@/hooks/use-media-query'
import { fetchUserAppData } from '@/lib/api/user-data-service'
import { useChatStore } from '@/lib/store/chat-store'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session, status } = useSession()
  const { isDesktop } = useBreakpoints()
  const sidebarOpen = useChatStore((state) => state.sidebarOpen)
  const setSidebarOpen = useChatStore((state) => state.setSidebarOpen)
  const mobileDrawerOpen = useChatStore((state) => state.mobileDrawerOpen)
  const setMobileDrawerOpen = useChatStore((state) => state.setMobileDrawerOpen)

  const isChatPage = pathname === '/chat' || pathname.startsWith('/chat/')
  const showDesktopSidebar = isChatPage && isDesktop && sidebarOpen
  const showMobileDrawer = isChatPage && !isDesktop

  useEffect(() => {
    router.prefetch('/')
    router.prefetch('/chat')
    router.prefetch('/profile')
    router.prefetch('/settings')
  }, [router])

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return

    void queryClient.prefetchQuery({
      queryKey: userDataQueryKey(session.user.id),
      queryFn: fetchUserAppData,
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient, session?.user?.id, status])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {showDesktopSidebar && (
        <aside className="hidden h-full w-[260px] shrink-0 lg:flex">
          <ChatHistorySidebar
            onClose={() => setSidebarOpen(false)}
            className="w-full"
          />
        </aside>
      )}

      {isChatPage && isDesktop && !sidebarOpen && (
        <div className="hidden h-full w-12 shrink-0 flex-col border-r border-border bg-card p-2 lg:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        <main
          className={cn(
            'flex-1 overflow-hidden',
            !isChatPage && 'overflow-y-auto bg-muted/10'
          )}
        >
          {isChatPage ? (
            children
          ) : (
            <div className="container mx-auto px-4 py-5 sm:p-6 lg:p-8">
              <PageTransition>{children}</PageTransition>
            </div>
          )}
        </main>
      </div>

      {showMobileDrawer && (
        <MobileSidebar
          open={mobileDrawerOpen}
          onOpenChange={setMobileDrawerOpen}
        />
      )}
    </div>
  )
}
