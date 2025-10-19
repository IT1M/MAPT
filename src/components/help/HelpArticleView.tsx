'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from '@/hooks/useTranslations'
import ReactMarkdown from 'react-markdown'
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon,
  PrinterIcon,
  ShareIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { HandThumbUpIcon as HandThumbUpSolidIcon } from '@heroicons/react/24/solid'

interface Article {
  id: string
  title: string
  slug: string
  category: string
  content: string
  tags: string[]
  views: number
  helpful: number
  notHelpful: number
  publishedAt: string
  updatedAt: string
  relatedArticles?: Array<{
    id: string
    title: string
    slug: string
    category: string
  }>
}

interface HelpArticleViewProps {
  article: Article
}

export default function HelpArticleView({ article }: HelpArticleViewProps) {
  const t = useTranslations('help')
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [helpful, setHelpful] = useState(article.helpful)
  const [notHelpful, setNotHelpful] = useState(article.notHelpful)

  async function submitFeedback(isHelpful: boolean) {
    if (feedbackGiven) return

    try {
      const res = await fetch(`/api/help/articles/${article.slug}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful: isHelpful })
      })

      if (res.ok) {
        const data = await res.json()
        setHelpful(data.helpful)
        setNotHelpful(data.notHelpful)
        setFeedbackGiven(true)
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  function handlePrint() {
    window.print()
  }

  async function handleShare() {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          url
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url)
      alert(t('linkCopied'))
    }
  }

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Article Header */}
      <header className="p-8 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">
            {article.category}
          </span>
          <span>•</span>
          <span className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {new Date(article.updatedAt).toLocaleDateString()}
          </span>
          <span>•</span>
          <span>{article.views} {t('views')}</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {article.title}
        </h1>

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            {t('print')}
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ShareIcon className="h-4 w-4 mr-2" />
            {t('share')}
          </button>
        </div>
      </header>

      {/* Article Content */}
      <div className="p-8 prose prose-teal dark:prose-invert max-w-none">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>

      {/* Feedback Section */}
      <div className="p-8 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('wasThisHelpful')}
        </h3>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => submitFeedback(true)}
            disabled={feedbackGiven}
            className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
              feedbackGiven
                ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20'
            }`}
          >
            <HandThumbUpIcon className="h-5 w-5 mr-2" />
            {t('yes')} ({helpful})
          </button>

          <button
            onClick={() => submitFeedback(false)}
            disabled={feedbackGiven}
            className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
              feedbackGiven
                ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <HandThumbDownIcon className="h-5 w-5 mr-2" />
            {t('no')} ({notHelpful})
          </button>
        </div>

        {feedbackGiven && (
          <p className="mt-4 text-sm text-teal-600 dark:text-teal-400">
            {t('thankYouForFeedback')}
          </p>
        )}
      </div>

      {/* Related Articles */}
      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <div className="p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('relatedArticles')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {article.relatedArticles.map(related => (
              <Link
                key={related.id}
                href={`/help/${related.slug}`}
                className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-500 transition-colors"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {related.category}
                </p>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {related.title}
                </h4>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
