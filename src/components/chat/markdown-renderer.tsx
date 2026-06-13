'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { CodeBlock } from './code-block'

interface MarkdownRendererProps {
  content: string
  className?: string
  isStreaming?: boolean
}

export function MarkdownRenderer({
  content,
  className,
  isStreaming = false,
}: MarkdownRendererProps) {
  return (
    <div className={cn('chat-markdown prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-relaxed text-[15px]">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-semibold mb-3 mt-4 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-4 my-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50 border-b border-border">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-medium">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border-t border-border">{children}</td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || '')
            const codeString = String(children).replace(/\n$/, '')

            if (match || codeString.includes('\n')) {
              return (
                <CodeBlock language={match?.[1]}>
                  {codeString}
                </CodeBlock>
              )
            }

            return (
              <code
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground"
                {...props}
              >
                {children}
              </code>
            )
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/70 animate-pulse rounded-sm" />
      )}
    </div>
  )
}
