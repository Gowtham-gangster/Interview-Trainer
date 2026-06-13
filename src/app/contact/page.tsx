import { Metadata } from 'next'
import { Linkedin, Mail } from 'lucide-react'

import { ContactForm } from '@/components/forms/contact-form'
import { MarketingPageShell } from '@/features/landing/components/marketing-page-shell'
import {
  CONTACT_EMAIL_LINK_LABEL,
  CONTACT_MAILTO,
  LINKEDIN_HREF,
  LINKEDIN_LINK_LABEL,
} from '@/lib/contact-info'
import {
  marketingCardClassName,
  marketingCardDescriptionClassName,
  marketingCardTitleClassName,
  marketingFooterNoteClassName,
  marketingIconBoxClassName,
  marketingLinkClassName,
  marketingMutedTextClassName,
  marketingSectionTitleClassName,
} from '@/lib/styles/marketing-styles'

export const metadata: Metadata = {
  title: 'Contact Us | AI Interview Trainer',
  description: 'Get in touch with the AI Interview Trainer team',
}

export default function ContactPage() {
  return (
    <MarketingPageShell title="Contact Us">
      <p>
        Have questions about the platform, your account, or partnership
        opportunities? We&apos;d love to hear from you.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={marketingCardClassName}>
          <div className={marketingIconBoxClassName}>
            <Mail className="h-5 w-5" />
          </div>
          <h2 className={`mt-4 ${marketingCardTitleClassName}`}>Email</h2>
          <p className={`mt-2 ${marketingCardDescriptionClassName}`}>
            For support and general inquiries
          </p>
          <a href={CONTACT_MAILTO} className={`mt-3 inline-block ${marketingLinkClassName}`}>
            {CONTACT_EMAIL_LINK_LABEL}
          </a>
        </div>

        <div className={marketingCardClassName}>
          <div className={marketingIconBoxClassName}>
            <Linkedin className="h-5 w-5" />
          </div>
          <h2 className={`mt-4 ${marketingCardTitleClassName}`}>LinkedIn</h2>
          <p className={`mt-2 ${marketingCardDescriptionClassName}`}>
            Connect with us on LinkedIn
          </p>
          <a
            href={LINKEDIN_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-3 inline-block ${marketingLinkClassName}`}
          >
            {LINKEDIN_LINK_LABEL}
          </a>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className={marketingSectionTitleClassName}>Send us a message</h2>
        <p className={marketingMutedTextClassName}>
          Fill out the form below and we will email you a confirmation. We
          typically respond within 1–2 business days.
        </p>
        <ContactForm />
      </div>

      <p className={marketingFooterNoteClassName}>
        You can also reach us using the Email or LinkedIn options above, or the
        contact form.
      </p>
    </MarketingPageShell>
  )
}
