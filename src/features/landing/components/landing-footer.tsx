import Link from 'next/link'
import { Linkedin, Mail, Sparkles } from 'lucide-react'

import { InstallAppButton } from '@/components/pwa/install-app-button'
import { CONTACT_MAILTO, LINKEDIN_HREF } from '@/lib/contact-info'

const productLinks = [
  { label: 'Core Features', href: '#features' },
  { label: 'Why Choose Us', href: '#why-choose' },
]

const accountLinks = [
  { label: 'Sign in', href: '/login' },
  { label: 'Sign up', href: '/register' },
]

const legalLinks = [
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
]

const socialLinks = [
  {
    label: 'LinkedIn',
    href: LINKEDIN_HREF,
    icon: Linkedin,
    external: true,
  },
  {
    label: 'Email',
    href: CONTACT_MAILTO,
    icon: Mail,
    external: false,
  },
]

const footerLinkButtonClassName =
  'h-auto w-full justify-start px-0 py-0 text-sm font-normal text-slate-600 hover:bg-transparent hover:text-slate-900 dark:text-slate-400 dark:hover:bg-transparent dark:hover:text-white sm:w-auto'

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-[#050a16]">
      <div className="container mx-auto px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                AI Interview Trainer
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              AI-powered interview preparation with resume analysis, technical preparation, and personalized coaching.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.external ? '_blank' : undefined}
                    rel={social.external ? 'noopener noreferrer' : undefined}
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-200 bg-white text-slate-600 transition-all hover:border-cyan-400 hover:text-cyan-600 dark:border-cyan-500/20 dark:bg-[#0f1a35]/60 dark:text-slate-400 dark:hover:border-cyan-400/50 dark:hover:text-cyan-400"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
              Product
            </h3>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
              Account
            </h3>
            <ul className="mt-4 space-y-3">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
              Support
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <InstallAppButton
                  alwaysVisible
                  variant="ghost"
                  size="sm"
                  className={footerLinkButtonClassName}
                />
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Contact Us
                </Link>
              </li>
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-white/5 sm:flex-row">
          <p className="text-center text-sm text-slate-500 sm:text-left dark:text-slate-500">
            &copy; {new Date().getFullYear()} AI Interview Trainer. All rights
            reserved.
          </p>
          <p className="text-center text-xs text-slate-500 sm:text-right dark:text-slate-600">
            Built with IBM watsonx Orchestrate &amp; GPT-OSS 120B
          </p>
        </div>
      </div>
    </footer>
  )
}
