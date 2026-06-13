'use client'

import { motion } from 'framer-motion'

import { hoverLift } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface HoverCardProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
}

export function HoverCard({
  children,
  className,
  as = 'div',
}: HoverCardProps) {
  const Component = motion[as]

  return (
    <Component
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={hoverLift}
      className={cn('ui-card-hover', className)}
    >
      {children}
    </Component>
  )
}
