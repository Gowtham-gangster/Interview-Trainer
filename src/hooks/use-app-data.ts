'use client'

import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createDefaultUserData,
  type AppSettings,
  type UserAppData,
} from '@/lib/data/app-storage'
import {
  fetchUserAppData,
  resetUserAppData,
  updateUserAppProfile,
  updateUserAppSettings,
} from '@/lib/api/user-data-service'
import type { UserProfile } from '@/types/profile'

export const userDataQueryKey = (userId?: string) => ['user-data', userId] as const

async function syncSessionProfile(
  updateSession: (data?: Session) => Promise<Session | null>,
  profile: UserProfile
) {
  await updateSession({
    user: {
      name: profile.name,
      email: profile.email,
      image: profile.avatar || null,
    },
  } as Session)
}

export function useAppData() {
  const { data: session, status, update: updateSession } = useSession()
  const userId = session?.user?.id
  const queryClient = useQueryClient()

  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: userDataQueryKey(userId),
    queryFn: fetchUserAppData,
    enabled: status === 'authenticated' && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previous) => previous,
    initialData: () =>
      userId
        ? queryClient.getQueryData<UserAppData>(userDataQueryKey(userId))
        : undefined,
    initialDataUpdatedAt: () =>
      userId
        ? queryClient.getQueryState(userDataQueryKey(userId))?.dataUpdatedAt
        : undefined,
    retry: 1,
  })

  const profileMutation = useMutation({
    mutationFn: ({
      profile,
      currentPassword,
    }: {
      profile: UserProfile
      currentPassword?: string
    }) => updateUserAppProfile(profile, currentPassword),
    onSuccess: async (next) => {
      queryClient.setQueryData(userDataQueryKey(userId), next)

      if (next.emailChangeSent) {
        await updateSession({
          user: {
            name: next.profile.name,
            image: next.profile.avatar || null,
          },
        } as Session)
        return
      }

      await syncSessionProfile(updateSession, next.profile)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save profile'
      )
    },
  })

  const settingsMutation = useMutation({
    mutationFn: updateUserAppSettings,
    onSuccess: (next) => {
      queryClient.setQueryData(userDataQueryKey(userId), next)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save settings'
      )
    },
  })

  const resetMutation = useMutation({
    mutationFn: resetUserAppData,
    onSuccess: (next) => {
      queryClient.setQueryData(userDataQueryKey(userId), next)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to reset profile'
      )
    },
  })

  const fallbackData =
    status === 'authenticated' && userId && !data && isPending
      ? createDefaultUserData(
          session?.user?.name ?? 'User',
          session?.user?.email ?? 'user@example.com'
        )
      : null

  return {
    data: data ?? fallbackData,
    isLoading:
      status === 'loading' ||
      (status === 'authenticated' && isPending && !data),
    isFetching,
    isAuthenticated: !!userId,
    updateProfile: async (
      profile: UserProfile,
      options?: { currentPassword?: string }
    ) => {
      if (!userId) return
      return profileMutation.mutateAsync({
        profile,
        currentPassword: options?.currentPassword,
      })
    },
    updateSettings: async (settings: AppSettings) => {
      if (!userId) return
      await settingsMutation.mutateAsync(settings)
    },
    resetData: async () => {
      if (!userId) return
      await resetMutation.mutateAsync()
    },
    reload: () => void refetch(),
  }
}

export type { UserAppData, AppSettings }
