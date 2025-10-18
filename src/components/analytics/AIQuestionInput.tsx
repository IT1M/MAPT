'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

// ============================================================================
// Type Definitions
// ============================================================================

export interface QuestionAnswer {
  question: string
  answer: string
  confidence: number
  timestamp: Date
  sources?: string[]
}

export interface InventoryContext {
  totalItems: number
  totalQuantity: number
  recentActivity?: Array<{
    itemName: string
    quantity: number
    destination: string
    date: string
  }>
  lowStockItems?: Array<{
    itemName: string
    currentStock: number
    reorderPoint: number
  }>
  topCategories?: Array<{
    category: string
    count: number
  }>
}

interface AIQuestionInputProps {
  context: InventoryContext
  onAnswer?: (qa: QuestionAnswer) => void
}

// ============================================================================
// Example Questions
// ============================================================================

const EXAMPLE_QUESTIONS = [
  'Why is reject rate high?',
  'Which category needs attention?',
  'What are the recent trends?',
  'How can we improve inventory efficiency?',
  'What items are running low?',
]

// ============================================================================
// Component
// ============================================================================

export function AIQuestionInput({ context, onAnswer }: AIQuestionInputProps) {
  const t = useTranslations('analytics.ai')
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<QuestionAnswer[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!question.trim() || isLoading) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics/ai-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          context,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get answer')
      }

      const data = await response.json()

      if (data.success) {
        const qa: QuestionAnswer = {
          question: data.data.question,
          answer: data.data.answer,
          confidence: data.data.confidence,
          timestamp: new Date(),
          sources: data.data.sources,
        }

        setHistory([qa, ...history])
        onAnswer?.(qa)
        setQuestion('')
      } else {
        throw new Error(data.error?.message || 'Failed to get answer')
      }
    } catch (err) {
      console.error('Error asking question:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (exampleQuestion: string) => {
    setQuestion(exampleQuestion)
  }

  const handleCopyAnswer = (answer: string) => {
    navigator.clipboard.writeText(answer)
  }

  return (
    <div className="space-y-4">
      {/* Question Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('askQuestion')}
            disabled={isLoading}
            className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Ask a question about analytics data"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Submit question"
          >
            {isLoading ? (
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Example Questions */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((exampleQuestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleExampleClick(exampleQuestion)}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exampleQuestion}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            {error}
          </div>
        )}
      </form>

      {/* Q&A History */}
      {history.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((qa, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3"
            >
              {/* Question */}
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">❓</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {qa.question}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {qa.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Answer */}
              <div className="flex items-start gap-2 pl-7">
                <span className="text-lg flex-shrink-0">🤖</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {qa.answer}
                  </p>
                  
                  {/* Confidence and Sources */}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Confidence: {(qa.confidence * 100).toFixed(0)}%
                    </span>
                    {qa.sources && qa.sources.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Sources: {qa.sources.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyAnswer(qa.answer)}
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Copy answer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {history.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <span className="text-4xl">💬</span>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Ask a question to get AI-powered insights
          </p>
        </div>
      )}
    </div>
  )
}
