function resolveContactEmail(): string {
  return (
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ??
    process.env.CONTACT_EMAIL ??
    ''
  )
}

/** Server / mailto use only — do not render in public UI. */
export const CONTACT_EMAIL = resolveContactEmail()

export const CONTACT_MAILTO = CONTACT_EMAIL
  ? `mailto:${CONTACT_EMAIL}`
  : '/contact'

/** Server-only — never use NEXT_PUBLIC_ for the profile URL. */
export function resolveLinkedInProfileUrl(): string {
  return (
    process.env.LINKEDIN_PROFILE_URL ??
    process.env.NEXT_PUBLIC_LINKEDIN_URL ??
    ''
  )
}

/** Internal path — actual LinkedIn URL is not exposed in page HTML. */
export const LINKEDIN_HREF = '/linkedin'

/** User-facing link labels (no raw email or profile URLs). */
export const CONTACT_EMAIL_LINK_LABEL = 'Send us an email'
export const LINKEDIN_LINK_LABEL = 'Connect on LinkedIn'
