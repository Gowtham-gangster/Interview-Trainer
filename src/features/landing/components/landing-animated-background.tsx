'use client'

import { motion } from 'framer-motion'

export function LandingAnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)]" />

      <motion.div
        animate={{ y: [0, -28, 0], x: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-[12%] top-24 h-72 w-72 rounded-full bg-violet-500/25 blur-[100px] dark:bg-violet-600/20"
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -16, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute right-[10%] top-32 h-80 w-80 rounded-full bg-cyan-400/20 blur-[120px] dark:bg-cyan-500/15"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-blue-500/15 blur-[90px] dark:bg-blue-600/10"
      />

      <div className="absolute left-1/2 top-1/3 h-px w-[min(90%,720px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
    </div>
  )
}
