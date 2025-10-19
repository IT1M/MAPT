'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  HandThumbUpIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import HelpArticleEditor from './HelpArticleEditor'

interface Article {
  id: string
  title: string
  slug: string
  category: string
  content: string
  tags: string[]
  status: 'DRAFT' | 'PUBLISHED'
  views: number
  helpful: number
  notHelpful: number
  publishedAt: string | null
  updatedAt: string
}

export default function HelpArticleManager() {
  const t = useTranslations('help.admin')
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    fetchArticles()
  }, [])

  async function fetchArticles() {
    setLoading(true)
    try {
      const res = await fetch('/api/help/articles?limit=100')
      const data = await res.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    setEditingArticle(null)
    setShowEditor(true)
  }

  function handleEdit(article: Article) {
    setEditingArticle(article)
    setShowEditor(true)
  }

  async function handleDelete(article: Article) {
    if (!confirm(t('confirmDelete', { title: article.title }))) {
      return
    }

    try {
      const res = await fetch(`/api/help/articles/${article.slug}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await fetchArticles()
      } else {
        alert(t('deleteFailed'))
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      alert(t('deleteFailed'))
    }
  }

  function handleEditorClose(saved: boolean) {
    setShowEditor(false)
    setEditingArticle(null)
    if (saved) {
      fetchArticles()
    }
  }

  const filteredArticles = articles.filter(article => {
    if (filter === 'all') return true
    if (filter === 'published') return article.status === 'PUBLISHED'
    if (filter === 'draft') return article.status === 'DRAFT'
    return true
  })

  if (showEditor) {
    return (
      <HelpArticleEditor
        article={editingArticle}
        onClose={handleEditorClose}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'all'
              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            {t('all')} ({articles.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'published'
              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            {t('published')} ({articles.filter(a => a.status === 'PUBLISHED').length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'draft'
              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            {t('drafts')} ({articles.filter(a => a.status === 'DRAFT').length})
          </button>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('createArticle')}
        </button>
      </div>

      {/* Articles Table */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('noArticles')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('noArticlesDescription')}
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('createFirstArticle')}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('title')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('stats')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('updated')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredArticles.map(article => (
                <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {article.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {article.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">
                      {article.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${article.status === 'PUBLISHED'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {article.views}
                      </span>
                      <span className="flex items-center">
                        <HandThumbUpIcon className="h-4 w-4 mr-1" />
                        {article.helpful}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(article.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(article)}
                        className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300"
                        title={t('edit')}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(article)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title={t('delete')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
