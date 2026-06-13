import { cn } from '@/lib/utils'

interface SettingsRowProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  bordered?: boolean
}

export function SettingsRow({
  title,
  description,
  children,
  className,
  bordered = true,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between',
        bordered && 'border-b border-border/60 last:border-0 last:pb-0 first:pt-0',
        className,
      )}
    >
      <div className="space-y-0.5 pr-4">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
