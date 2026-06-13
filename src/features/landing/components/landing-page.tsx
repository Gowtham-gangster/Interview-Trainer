'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  Code,
  Database,
  FileText,
  MessageCircle,
  Mic,
  Sparkles,
  Target,
  UserCircle,
  Users,
  Volume2,
} from 'lucide-react'

import { LandingAnimatedBackground } from '@/features/landing/components/landing-animated-background'
import { LandingHeader } from '@/features/landing/components/landing-header'
import { LandingFeatureCard } from '@/features/landing/components/landing-feature-card'
import { LandingFooter } from '@/features/landing/components/landing-footer'
import {
  LandingFeatureGrid,
  LandingSection,
  LandingSectionHeading,
} from '@/features/landing/components/landing-section'
import { LandingTechMarquee } from '@/features/landing/components/landing-tech-marquee'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/motion/variants'

const coreFeatures = [
  {
    title: 'Resume Analysis',
    description:
      'Extracts skills, projects, education, experience level and recommended job roles.',
    icon: FileText,
  },
  {
    title: 'Technical Preparation',
    description:
      'RAG-powered preparation for Java, Spring Boot, MySQL, DSA and company interviews.',
    icon: Code,
  },
  {
    title: 'Company-Specific Questions',
    description:
      'Curated questions and insights specific to target companies, culture fit evaluation and company research guidance.',
    icon: Building2,
  },
  {
    title: 'HR Interview Coach',
    description:
      'Personalized HR and behavioral interview guidance with model answers and coaching.',
    icon: Users,
  },
  {
    title: 'Soft Skills Coaching',
    description:
      'Communication, teamwork, leadership, self-introduction and confidence building.',
    icon: MessageCircle,
  },
  {
    title: 'Mock Interviews',
    description:
      'Interactive interview sessions with scoring, feedback and performance tracking.',
    icon: Mic,
  },
  {
    title: 'Final Assessment',
    description:
      'Generates strengths, weaknesses, readiness scores and improvement plans.',
    icon: BarChart3,
  },
]

const whyChoose = [
  {
    title: 'Resume-Based Personalization',
    description: 'Questions and coaching adapt to the candidate profile.',
    icon: UserCircle,
  },
  {
    title: 'Agentic AI Architecture',
    description: 'Multiple specialized agents collaborate intelligently.',
    icon: Bot,
  },
  {
    title: 'RAG-Powered Retrieval',
    description: 'Uses curated interview knowledge instead of generic responses.',
    icon: Database,
  },
  {
    title: 'Voice-Enabled Experience',
    description: 'IBM Watson STT and TTS enable realistic mock interviews.',
    icon: Volume2,
  },
  {
    title: 'Automated Evaluation',
    description: 'Scores answers and identifies improvement opportunities.',
    icon: CheckCircle2,
  },
  {
    title: 'Readiness Assessment',
    description: 'Provides complete interview readiness reports.',
    icon: Target,
  },
]

const heroStats = [
  { value: '7+', label: 'Core Modules' },
  { value: 'Voice', label: 'Mock Interviews' },
  { value: 'RAG', label: 'Smart Retrieval' },
  { value: '24/7', label: 'AI Coaching' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-[#070d1f] dark:text-white">
      <LandingHeader />

      <section className="relative overflow-hidden px-4 py-16 sm:py-24 lg:py-32">
        <LandingAnimatedBackground />

        <div className="container relative mx-auto max-w-5xl text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            <motion.div
              variants={staggerItem}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-1.5 text-xs font-medium text-cyan-800 shadow-sm backdrop-blur-sm dark:border-cyan-400/30 dark:bg-cyan-950/50 dark:text-cyan-200"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </span>
              Powered by IBM watsonx &amp; GPT-OSS 120B
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
            >
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-shift dark:from-cyan-400 dark:via-blue-400 dark:to-violet-400">
                Prepare Smarter.
              </span>
              <br />
              <span className="text-slate-900 dark:text-white">Interview Better.</span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mx-auto mt-8 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg"
            >
              An AI-powered interview preparation platform with resume analysis,
              company-specific questions, RAG-based technical coaching, and personalized
              readiness reports.
            </motion.p>

            <motion.div
              variants={staggerItem}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <motion.a
                href="#features"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30"
              >
                Explore Features
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </motion.a>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/register"
                  className="inline-flex min-w-[180px] items-center justify-center rounded-xl border border-cyan-300 bg-white/90 px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur-sm transition-colors hover:border-cyan-400 hover:bg-white dark:border-cyan-500/40 dark:bg-[#0f1a35]/70 dark:text-white dark:hover:border-cyan-400/70"
                >
                  Get Started
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="mt-14 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {heroStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + index * 0.08 }}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-[#0f1a35]/50"
                >
                  <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <LandingTechMarquee />
        </div>
      </section>

      <LandingSection id="features">
        <LandingSectionHeading
          eyebrow="Platform"
          title="Core Features"
          description="Everything you need to go from resume upload to interview-ready — in one intelligent workspace."
        />

        <LandingFeatureGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {coreFeatures.slice(0, 4).map((feature, index) => (
            <LandingFeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </LandingFeatureGrid>
        <LandingFeatureGrid className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.slice(4).map((feature, index) => (
            <LandingFeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </LandingFeatureGrid>
      </LandingSection>

      <LandingSection id="why-choose" className="relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent" />

        <LandingSectionHeading
          eyebrow="Advantages"
          title="Why Choose Our Solution?"
          description="Built for students and professionals who want focused practice."
        />

        <LandingFeatureGrid className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyChoose.map((item, index) => (
            <LandingFeatureCard
              key={item.title}
              {...item}
              variant="why"
              index={index}
            />
          ))}
        </LandingFeatureGrid>
      </LandingSection>

      <section className="px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeInUp}
          className="container relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-white via-cyan-50/50 to-blue-50/40 px-8 py-14 text-center shadow-xl shadow-cyan-500/10 dark:border-cyan-500/25 dark:from-[#0c1428] dark:via-[#0f1a35] dark:to-[#111a33]"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 animate-glow-pulse rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 animate-glow-pulse rounded-full bg-violet-500/15 blur-3xl [animation-delay:1s]" />

          <h2 className="relative text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
            Ready to start your interview preparation?
          </h2>
          <p className="relative mt-4 text-slate-600 dark:text-slate-400">
            Create a free account and practice with the AI Interview Trainer Agent today.
          </p>
          <motion.div
            className="relative mt-8"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30"
            >
              Start Practicing Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <LandingFooter />
      </motion.div>
    </div>
  )
}
