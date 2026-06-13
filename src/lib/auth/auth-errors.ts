const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    'This email is already registered. Sign in with your password, then link Google from profile settings.',
  OAuthCallback:
    'Google sign-in could not be completed. Please try again.',
  OAuthCreateAccount:
    'Could not create your account with Google. Please try again.',
  DatabaseUnavailable:
    'The database is unreachable. If you are deploying, set DATABASE_URL on Vercel and run prisma db push against Railway.',
  OAuthSignin: 'Could not start Google sign-in. Please try again.',
  Callback: 'Sign-in failed. Please try again.',
  SessionRequired: 'Your session expired. Please sign in again.',
  Configuration:
    'Authentication is not configured correctly. Contact support if this persists.',
  AccessDenied:
    'Google sign-in was blocked. Please try again or use email and password.',
  GoogleEmailNotVerified:
    'Google could not verify this email address. Use an active Google account or sign up with email and password.',
  Default: 'Sign-in failed. Please try again.',
}

export function getAuthErrorMessage(error?: string | null): string | null {
  if (!error) return null
  return AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default
}
