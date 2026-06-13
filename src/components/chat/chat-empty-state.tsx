'use client'

import { motion } from 'framer-motion'
import { Code, MessageCircle, Sparkles, Users } from 'lucide-react'

import { StaggerItem, StaggerList } from '@/components/motion/stagger-list'
import { useChatStore } from '@/lib/store/chat-store'
import { fadeInUp, scaleIn } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface ChatEmptyStateProps {
  className?: string
}

const suggestions = [
  {
    icon: Code,
    title: 'Technical Interview',
    prompt: 'Practice a technical interview for a Software Engineer role',
  },
  {
    icon: Users,
    title: 'Behavioral Questions',
    prompt: 'Ask me behavioral interview questions using the STAR method',
  },
  {
    icon: MessageCircle,
    title: 'System Design',
    prompt: 'Help me practice system design interview questions',
  },
]

export function ChatEmptyState({ className }: ChatEmptyStateProps) {
  const { setInputValue } = useChatStore()

  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center px-3 py-8 sm:px-4 sm:py-12',
        className,
      )}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={scaleIn}
        className="relative mb-6"
      >
        <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-2xl" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/25">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="mb-8 text-center"
      >
        <h2 className="mb-2 text-2xl font-semibold tracking-tight">
          How can I help you practice today?
        </h2>
        <p className="max-w-md text-[15px] text-muted-foreground">
          Upload your resume, use voice input, and get real-time feedback on your
          answers.
        </p>
      </motion.div>

      <StaggerList className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {suggestions.map((item) => (
          <StaggerItem key={item.title}>
            <motion.button
              type="button"
              onClick={() => setInputValue(item.prompt)}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="ui-card-hover group flex w-full flex-col items-start gap-2 rounded-xl border border-border/60 bg-card/80 p-4 text-left backdrop-blur-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{item.title}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {item.prompt}
              </span>
            </motion.button>
          </StaggerItem>
        ))}
      </StaggerList>
    </div>
  )
}
