import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AppState {
  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  
  // User state
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  
  // Global loading state
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  // Global error state
  error: string | null
  setError: (error: string | null) => void
  clearError: () => void
  
  // Mobile responsiveness
  isMobile: boolean
  setIsMobile: (mobile: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // UI
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      // User
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      
      // Loading
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Error
      error: null,
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      // Mobile
      isMobile: false,
      setIsMobile: (mobile) => set({ isMobile: mobile }),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        currentUser: state.currentUser,
      }),
    }
  )
)