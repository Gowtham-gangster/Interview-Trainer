import { Metadata } from 'next'

import { MarketingPageShell } from '@/features/landing/components/marketing-page-shell'
import { CONTACT_MAILTO } from '@/lib/contact-info'
import {
  marketingLegalHeadingClassName,
  marketingLegalLinkClassName,
  marketingLegalMutedClassName,
} from '@/lib/styles/marketing-styles'

export const metadata: Metadata = {
  title: 'Privacy Policy | AI Interview Trainer',
  description: 'Privacy policy for AI Interview Trainer',
}

export default function PrivacyPage() {
  return (
    <MarketingPageShell title="Privacy Policy">
      <p className={marketingLegalMutedClassName}>Last updated: June 2026</p>
      <p>
        AI Interview Trainer respects your privacy. This policy explains what
        information we collect and how we use it.
      </p>
      <h2 className={marketingLegalHeadingClassName}>Information We Collect</h2>
      <p>
        We collect account details (name, email), profile and resume data,
        interview session history, and preferences you save in the app.
      </p>
      <h2 className={marketingLegalHeadingClassName}>How We Use Your Data</h2>
      <p>
        Your data is used to personalize coaching, store chat sessions, improve
        your interview preparation experience, and operate core platform features
        including voice practice.
      </p>
      <h2 className={marketingLegalHeadingClassName}>Data Security</h2>
      <p>
        We apply reasonable technical and organizational measures to protect
        your information. Passwords are stored using secure hashing.
      </p>
      <h2 className={marketingLegalHeadingClassName}>Your Rights</h2>
      <p>
        You may update profile details in your account settings or contact us to
        request account-related assistance.
      </p>
      <h2 className={marketingLegalHeadingClassName}>Contact</h2>
      <p>
        For privacy-related questions, visit our{' '}
        <a href={CONTACT_MAILTO} className={marketingLegalLinkClassName}>
          Contact Us
        </a>{' '}
        page.
      </p>
    </MarketingPageShell>
  )
}
