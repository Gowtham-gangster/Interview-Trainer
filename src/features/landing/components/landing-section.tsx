'use client'

import { motion } from 'framer-motion'

import { fadeInUp, staggerContainer } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface LandingSectionProps {
  id?: string
  children: React.ReactNode
  className?: string
}

export function LandingSection({ id, children, className }: LandingSectionProps) {
  return (
    <section id={id} className={cn('px-4 py-20', className)}>
      <div className="container mx-auto max-w-6xl">{children}</div>
    </section>
  )
}

export function LandingSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeInUp}
      className="mb-14 text-center"
    >
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
        <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 bg-clip-text text-transparent dark:from-cyan-400 dark:via-blue-400 dark:to-violet-400">
          {title}
        </span>
      </h2>
      {description ? (
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </motion.div>
  )
}

export function LandingFeatureGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  )
}
