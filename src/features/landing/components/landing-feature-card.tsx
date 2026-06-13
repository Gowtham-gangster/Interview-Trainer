'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

import { staggerItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface LandingFeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  variant?: 'core' | 'why'
  index?: number
}

export function LandingFeatureCard({
  title,
  description,
  icon: Icon,
  variant = 'core',
  index = 0,
}: LandingFeatureCardProps) {
  const isWhy = variant === 'why'

  return (
    <motion.article
      variants={staggerItem}
      custom={index}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border px-6 py-8 text-center shadow-sm transition-colors',
        isWhy
          ? 'border-slate-200 bg-white dark:border-[#1e2a4a] dark:bg-[#111a33]/80 dark:backdrop-blur-sm'
          : 'border-cyan-200/80 bg-white dark:border-cyan-500/30 dark:bg-[#0f1a35]/90 dark:backdrop-blur-sm'
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          isWhy
            ? 'bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/10'
            : 'bg-gradient-to-br from-cyan-500/8 via-transparent to-blue-500/10'
        )}
      />

      <motion.div
        className={cn(
          'relative mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm',
          isWhy
            ? 'border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300'
            : 'border-cyan-200 bg-cyan-50 text-cyan-600 dark:border-cyan-500/30 dark:bg-cyan-950/40 dark:text-cyan-300'
        )}
        whileHover={{ rotate: [0, -6, 6, 0], scale: 1.08 }}
        transition={{ duration: 0.45 }}
      >
        <Icon className="h-5 w-5" />
      </motion.div>

      <h3
        className={cn(
          'relative text-lg font-semibold',
          isWhy
            ? 'bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-cyan-400'
            : 'text-cyan-600 dark:text-cyan-400'
        )}
      >
        {title}
      </h3>
      <p className="relative mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </motion.article>
  )
}
