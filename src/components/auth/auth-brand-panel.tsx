'use client'

import { motion } from 'framer-motion'
import { Bot, FileText, Mic, Sparkles } from 'lucide-react'

import { fadeInUp, staggerContainer, staggerItem } from '@/lib/motion/variants'

const features = [
  {
    icon: Mic,
    title: 'Voice Mock Interviews',
    description: 'IBM Watson STT & TTS for realistic practice sessions.',
  },
  {
    icon: FileText,
    title: 'Resume Analysis',
    description:
      'Extracts skills, projects, and experience to personalize your prep.',
  },
  {
    icon: Bot,
    title: 'Agentic AI Coaching',
    description: 'RAG-powered guidance tailored to your resume and goals.',
  },
]

export function AuthBrandPanel() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="relative hidden h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-cyan-50/50 p-8 shadow-sm dark:border-cyan-500/25 dark:from-[#0c1428] dark:to-[#0f1a35] dark:shadow-[0_0_40px_rgba(34,211,238,0.08)] lg:flex"
    >
      {/* Light-mode glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-200/40 blur-2xl dark:hidden" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-cyan-100/60 blur-3xl dark:hidden" />
      {/* Dark-mode glow */}
      <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.1),transparent_55%)] dark:block" />
      <div className="pointer-events-none absolute -right-16 -top-16 hidden h-48 w-48 rounded-full bg-violet-600/20 blur-2xl dark:block" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 hidden h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl dark:block" />

      <div className="relative">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-950/60 dark:text-cyan-200">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Interview Training
        </div>
        <h2 className="max-w-sm text-3xl font-bold leading-tight tracking-tight text-cyan-800 dark:text-cyan-300">
          Prepare Smarter. Interview Better.
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          Practice technical, HR, and behavioral interviews with instant AI
          feedback — built for students and professionals.
        </p>
      </div>

      <motion.div
        className="relative space-y-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm transition-colors hover:border-cyan-300 dark:border-cyan-500/25 dark:bg-[#111a33] dark:hover:border-cyan-400/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-cyan-200">
                  {feature.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
