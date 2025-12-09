import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PaperAirplaneIcon,
  SparklesIcon,
  UserIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
} from '@/components/ui'
import { assistantApi, datasetsApi, mlApi } from '@/api'
import { useToastActions } from '@/contexts'
import { cn } from '@/utils'
import type { ChatMessage, AskQuestionParams } from '@/types'

const suggestedQuestions = [
  'What are the main insights from my data?',
  'Which features are most important?',
  'Are there any data quality issues?',
  'How well does my model perform?',
  'What do the correlations mean?',
  'Can you explain the F1 score?',
]

export function AssistantPage() {
  const toast = useToastActions()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [selectedDatasetId, setSelectedDatasetId] = useState('')
  const [selectedModelId, setSelectedModelId] = useState('')

  // Fetch datasets
  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsApi.list(),
  })

  // Fetch models
  const { data: modelsData } = useQuery({
    queryKey: ['trained-models'],
    queryFn: () => mlApi.listModels(),
  })

  // Check assistant status
  const { data: statusData } = useQuery({
    queryKey: ['assistant-status'],
    queryFn: () => assistantApi.getStatus(),
    refetchInterval: 30000,
  })

  // Ask mutation
  const askMutation = useMutation({
    mutationFn: (params: AskQuestionParams) => assistantApi.ask(params),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, timestamp: new Date().toISOString() },
      ])
    },
    onError: () => {
      toast.error('Error', 'Could not get a response. Please try again.')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ])
    },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')

    askMutation.mutate({
      question: input,
      dataset_id: selectedDatasetId || undefined,
      model_id: selectedModelId || undefined,
    })
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const datasets = datasetsData?.results || []
  const models = modelsData?.results || []
  const isAvailable = statusData?.available !== false

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <CardHeader className="flex-shrink-0 border-b border-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>AI Assistant</CardTitle>
                  <p className="text-sm text-muted">
                    {isAvailable ? 'Ready to help' : 'Currently unavailable'}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <SparklesIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  How can I help you?
                </h3>
                <p className="text-secondary max-w-md mb-6">
                  Ask me anything about your data, models, or analysis results.
                  I can explain metrics, suggest improvements, and help you understand your findings.
                </p>

                {/* Suggested Questions */}
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {suggestedQuestions.slice(0, 4).map((question) => (
                    <button
                      key={question}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="px-3 py-2 text-sm rounded-xl neu-raised hover:neu-button transition-all text-secondary"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <SparklesIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[70%] p-4 rounded-2xl',
                        message.role === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'neu-raised'
                      )}
                    >
                      <p className={cn(
                        'text-sm whitespace-pre-wrap',
                        message.role === 'user' ? 'text-white' : 'text-primary'
                      )}>
                        {message.content}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Loading indicator */}
            {askMutation.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="p-4 rounded-2xl neu-raised">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-4 border-t border-subtle">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  disabled={!isAvailable}
                  rows={1}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl resize-none',
                    'bg-transparent neu-input',
                    'text-primary placeholder:text-muted',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || askMutation.isPending || !isAvailable}
                className="flex-shrink-0"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Context Panel */}
      <div className="w-80 flex-shrink-0 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Dataset"
              value={selectedDatasetId}
              onChange={setSelectedDatasetId}
              options={[
                { value: '', label: 'None selected' },
                ...datasets
                  .filter((d) => d.status === 'ready')
                  .map((d) => ({ value: d.id, label: d.name })),
              ]}
              placeholder="Select a dataset..."
            />

            <Select
              label="Model"
              value={selectedModelId}
              onChange={setSelectedModelId}
              options={[
                { value: '', label: 'None selected' },
                ...models.map((m) => ({
                  value: m.id,
                  label: `${m.display_name} - ${m.target_column}`,
                })),
              ]}
              placeholder="Select a model..."
            />

            <div className="flex items-start gap-2 p-3 rounded-lg bg-info-50 dark:bg-info-900/20">
              <InformationCircleIcon className="w-5 h-5 text-info-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-info-700 dark:text-info-300">
                Select a dataset or model to get more specific answers about your data.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg neu-raised hover:neu-button transition-all text-secondary"
                >
                  {question}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AssistantPage
