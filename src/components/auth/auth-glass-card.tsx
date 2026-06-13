'use client'

import { motion } from 'framer-motion'

import { scaleIn } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface AuthGlassCardProps {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthGlassCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthGlassCardProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleIn}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-cyan-500/30 dark:bg-[#0f1a35] dark:shadow-[0_0_32px_rgba(34,211,238,0.1)] sm:p-8',
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>

      {children}

      {footer && (
        <div className="mt-6 border-t border-slate-200 pt-6 dark:border-white/5">
          {footer}
        </div>
      )}
    </motion.div>
  )
}
