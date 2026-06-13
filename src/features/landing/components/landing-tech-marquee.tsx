'use client'

import { motion } from 'framer-motion'
import { Bot, Brain, Database, Mic, Sparkles } from 'lucide-react'

const techItems = [
  { label: 'IBM watsonx Orchestrate', icon: Bot },
  { label: 'GPT-OSS 120B', icon: Brain },
  { label: 'RAG Knowledge Base', icon: Database },
  { label: 'Speech-to-Text', icon: Mic },
  { label: 'Text-to-Speech', icon: Sparkles },
  { label: 'Agentic AI', icon: Bot },
  { label: 'Mock Interviews', icon: Mic },
]

export function LandingTechMarquee() {
  const items = [...techItems, ...techItems]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.5 }}
      className="relative mt-14 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-50 to-transparent dark:from-[#070d1f]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-50 to-transparent dark:from-[#070d1f]" />

      <div className="flex w-max animate-marquee gap-3">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={`${item.label}-${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/80 px-4 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm dark:border-cyan-500/25 dark:bg-[#0f1a35]/70 dark:text-slate-200"
            >
              <Icon className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              {item.label}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
