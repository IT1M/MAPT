'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdvancedSearchBar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'user' | 'action' | 'item'>('all')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/audit?search=${encodeURIComponent(searchQuery)}&type=${searchType}`)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Advanced Audit Search
      </h3>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit logs..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>

        <div className="flex gap-2">
          {(['all', 'user', 'action', 'item'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSearchType(type)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                searchType === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => {
              setSearchQuery('action:login')
              setSearchType('action')
            }}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-left"
          >
            Login Events
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('action:delete')
              setSearchType('action')
            }}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-left"
          >
            Deletions
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('action:update')
              setSearchType('action')
            }}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-left"
          >
            Updates
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('severity:high')
              setSearchType('all')
            }}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-left"
          >
            High Severity
          </button>
        </div>
      </form>
    </div>
  )
}
