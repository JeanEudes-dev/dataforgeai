import ReactMarkdown from 'react-markdown'
import { cn } from '@/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
  variant?: 'default' | 'chat'
}

export function MarkdownRenderer({
  content,
  className,
  variant = 'default'
}: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none',
        variant === 'default' && [
          'prose-headings:text-gray-900 prose-headings:font-semibold',
          'prose-p:text-gray-700 prose-p:leading-relaxed',
          'prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline',
          'prose-strong:text-gray-900 prose-strong:font-semibold',
          'prose-ul:text-gray-700 prose-ol:text-gray-700',
          'prose-li:marker:text-gray-400',
          'prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-gray-800 prose-code:font-mono prose-code:text-xs',
          'prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg',
          'prose-blockquote:border-l-primary-500 prose-blockquote:bg-gray-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg',
          'dark:prose-invert dark:prose-headings:text-gray-100 dark:prose-p:text-gray-300',
          'dark:prose-code:bg-gray-800 dark:prose-code:text-gray-200',
          'dark:prose-blockquote:bg-gray-800/50',
        ],
        variant === 'chat' && [
          'prose-p:my-1 prose-p:leading-relaxed',
          'prose-ul:my-2 prose-ol:my-2',
          'prose-li:my-0.5',
          'prose-headings:my-2 prose-headings:text-sm prose-headings:font-semibold',
          'prose-code:bg-white/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs',
          'prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:my-2',
          '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        ],
        className
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
