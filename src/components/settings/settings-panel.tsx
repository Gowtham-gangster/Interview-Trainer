import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SettingsPanelProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  footer?: React.ReactNode
}

export function SettingsPanel({
  title,
  description,
  children,
  className,
  footer,
}: SettingsPanelProps) {
  return (
    <Card className={cn('border-border/60 shadow-sm', className)}>
      <CardHeader className="border-b border-border/40 bg-muted/20 px-4 py-4 sm:px-6 sm:py-5">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-6 sm:py-5">{children}</CardContent>
      {footer && (
        <div className="flex items-center justify-end border-t border-border/40 bg-muted/10 px-4 py-3 sm:px-6 sm:py-4">
          {footer}
        </div>
      )}
    </Card>
  )
}
