'use client'

import { useWatsonxHealth } from '@/hooks/api/use-watsonx-health'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function OrchestrateStatusBadge({ className }: { className?: string }) {
  const { data, isLoading, isError } = useWatsonxHealth()

  const connected = data?.orchestrate?.connected === true
  const label = isLoading
    ? 'Connecting…'
    : connected
      ? 'Agent connected'
      : 'Agent offline'

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] h-5 shrink-0',
        isLoading && 'text-muted-foreground',
        connected &&
          'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        !isLoading &&
          !connected &&
          'border-destructive/40 bg-destructive/10 text-destructive',
        className
      )}
      title={
        isError
          ? 'Could not reach /api/health'
          : connected
            ? `IBM Interview Trainer Agent (${data?.orchestrate?.environment_name ?? 'unknown'} env)`
            : data?.reason ??
              'Check WATSONX_API_KEY and WATSONX_INSTANCE_URL in Vercel env vars'
      }
    >
      <span
        className={cn(
          'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
          isLoading && 'bg-muted-foreground animate-pulse',
          connected && 'bg-emerald-500',
          !isLoading && !connected && 'bg-destructive'
        )}
      />
      {label}
    </Badge>
  )
}
