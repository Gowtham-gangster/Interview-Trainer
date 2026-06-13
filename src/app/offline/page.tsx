import Link from 'next/link'

export const metadata = {
  title: 'Offline',
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Check your internet connection, then reopen AI Interview Trainer.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Try again
      </Link>
    </div>
  )
}
