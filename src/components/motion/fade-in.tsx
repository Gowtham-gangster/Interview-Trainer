'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'

import { fadeInUp } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number
}

export function FadeIn({
  children,
  className,
  delay = 0,
  ...props
}: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
