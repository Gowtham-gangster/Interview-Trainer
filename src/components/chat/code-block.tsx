'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, copyToClipboard } from '@/lib/utils'

interface CodeBlockProps {
  children: string
  language?: string
  className?: string
}

export function CodeBlock({ children, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await copyToClipboard(children.trim())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  return (
    <div
      className={cn(
        'chat-code-block not-prose group/code relative my-3 overflow-hidden rounded-lg border border-zinc-700/80 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-600/80 bg-zinc-800 px-4 py-2 text-xs text-zinc-300">
        <span className="font-mono uppercase tracking-wide">
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-white/60 hover:text-white hover:bg-white/10"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="chat-code-block__pre m-0 overflow-x-auto bg-zinc-950 p-4 text-sm leading-relaxed">
        <code className="chat-code-block__code block font-mono text-[15px] font-normal leading-relaxed text-zinc-100 whitespace-pre">
          {children}
        </code>
      </pre>
    </div>
  )
}
