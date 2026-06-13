'use client'

import { motion } from 'framer-motion'

import { staggerContainer, staggerItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface StaggerListProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'ul' | 'section'
}

export function StaggerList({
  children,
  className,
  as = 'div',
}: StaggerListProps) {
  const Component = motion[as]

  return (
    <Component
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={cn(className)}
    >
      {children}
    </Component>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div variants={staggerItem} className={cn(className)}>
      {children}
    </motion.div>
  )
}
