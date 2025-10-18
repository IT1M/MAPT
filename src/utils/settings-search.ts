/**
 * Settings Search Utilities
 * Provides search functionality for settings interface with highlighting
 */

import React from 'react'

export interface SearchableItem {
  id: string
  section: string
  title: string
  description?: string
  keywords?: string[]
  path: string
}

export interface SearchResult extends SearchableItem {
  score: number
  matches: {
    field: 'title' | 'description' | 'keywords'
    text: string
    indices: [number, number][]
  }[]
}

/**
 * Normalize text for search (lowercase, remove diacritics)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim()
}

/**
 * Find all occurrences of query in text
 */
function findMatches(text: string, query: string): [number, number][] {
  const normalizedText = normalizeText(text)
  const normalizedQuery = normalizeText(query)
  const matches: [number, number][] = []
  
  let index = normalizedText.indexOf(normalizedQuery)
  while (index !== -1) {
    matches.push([index, index + normalizedQuery.length])
    index = normalizedText.indexOf(normalizedQuery, index + 1)
  }
  
  return matches
}

/**
 * Calculate relevance score for a search result
 */
function calculateScore(item: SearchableItem, query: string): number {
  const normalizedQuery = normalizeText(query)
  let score = 0
  
  // Title match (highest weight)
  const titleMatches = findMatches(item.title, query)
  if (titleMatches.length > 0) {
    score += titleMatches.length * 10
    // Bonus for exact match
    if (normalizeText(item.title) === normalizedQuery) {
      score += 50
    }
    // Bonus for starts with
    if (normalizeText(item.title).startsWith(normalizedQuery)) {
      score += 20
    }
  }
  
  // Description match (medium weight)
  if (item.description) {
    const descMatches = findMatches(item.description, query)
    score += descMatches.length * 5
  }
  
  // Keywords match (medium weight)
  if (item.keywords) {
    item.keywords.forEach(keyword => {
      const keywordMatches = findMatches(keyword, query)
      score += keywordMatches.length * 7
      // Bonus for exact keyword match
      if (normalizeText(keyword) === normalizedQuery) {
        score += 15
      }
    })
  }
  
  return score
}

/**
 * Search through settings items
 */
export function searchSettings(
  items: SearchableItem[],
  query: string,
  options: {
    minScore?: number
    maxResults?: number
  } = {}
): SearchResult[] {
  const { minScore = 1, maxResults = 50 } = options
  
  if (!query.trim()) {
    return []
  }
  
  const results: SearchResult[] = []
  
  for (const item of items) {
    const score = calculateScore(item, query)
    
    if (score < minScore) {
      continue
    }
    
    const matches: SearchResult['matches'] = []
    
    // Find matches in title
    const titleMatches = findMatches(item.title, query)
    if (titleMatches.length > 0) {
      matches.push({
        field: 'title',
        text: item.title,
        indices: titleMatches,
      })
    }
    
    // Find matches in description
    if (item.description) {
      const descMatches = findMatches(item.description, query)
      if (descMatches.length > 0) {
        matches.push({
          field: 'description',
          text: item.description,
          indices: descMatches,
        })
      }
    }
    
    // Find matches in keywords
    if (item.keywords) {
      item.keywords.forEach(keyword => {
        const keywordMatches = findMatches(keyword, query)
        if (keywordMatches.length > 0) {
          matches.push({
            field: 'keywords',
            text: keyword,
            indices: keywordMatches,
          })
        }
      })
    }
    
    results.push({
      ...item,
      score,
      matches,
    })
  }
  
  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score)
  
  // Limit results
  return results.slice(0, maxResults)
}

/**
 * Highlight matches in text
 */
export function highlightMatches(
  text: string,
  indices: [number, number][],
  highlightClass: string = 'bg-yellow-200 dark:bg-yellow-800'
): React.ReactNode[] {
  if (indices.length === 0) {
    return [text]
  }
  
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  
  // Sort indices by start position
  const sortedIndices = [...indices].sort((a, b) => a[0] - b[0])
  
  sortedIndices.forEach(([start, end], i) => {
    // Add text before match
    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start))
    }
    
    // Add highlighted match
    parts.push(
      React.createElement(
        'mark',
        { key: i, className: highlightClass },
        text.substring(start, end)
      )
    )
    
    lastIndex = end
  })
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }
  
  return parts
}

/**
 * Build searchable items from settings structure
 */
export function buildSearchableItems(
  translations: Record<string, any>,
  locale: string = 'en'
): SearchableItem[] {
  const items: SearchableItem[] = []
  
  // Profile settings
  items.push({
    id: 'profile',
    section: translations.sections?.profile || 'Profile',
    title: translations.profile?.title || 'Profile Settings',
    description: translations.profile?.subtitle,
    keywords: ['avatar', 'name', 'email', 'phone', 'department', 'employee'],
    path: '/settings?section=profile',
  })
  
  // Security settings
  items.push({
    id: 'security',
    section: translations.sections?.security || 'Security',
    title: translations.security?.title || 'Security Settings',
    description: translations.security?.subtitle,
    keywords: ['password', 'sessions', 'audit', 'login', 'authentication'],
    path: '/settings?section=security',
  })
  
  items.push({
    id: 'security-password',
    section: translations.sections?.security || 'Security',
    title: translations.security?.changePassword || 'Change Password',
    description: 'Update your account password',
    keywords: ['password', 'security', 'authentication'],
    path: '/settings?section=security&focus=password',
  })
  
  items.push({
    id: 'security-sessions',
    section: translations.sections?.security || 'Security',
    title: translations.security?.sessions || 'Active Sessions',
    description: translations.security?.sessionsSubtitle,
    keywords: ['sessions', 'devices', 'logout', 'signout'],
    path: '/settings?section=security&focus=sessions',
  })
  
  // User Management
  items.push({
    id: 'users',
    section: translations.sections?.users || 'User Management',
    title: translations.users?.title || 'User Management',
    description: translations.users?.subtitle,
    keywords: ['users', 'accounts', 'roles', 'permissions', 'admin'],
    path: '/settings?section=users',
  })
  
  // Appearance settings
  items.push({
    id: 'appearance',
    section: translations.sections?.appearance || 'Appearance',
    title: translations.appearance?.title || 'Appearance',
    description: translations.appearance?.subtitle,
    keywords: ['theme', 'dark', 'light', 'colors', 'font', 'density', 'ui'],
    path: '/settings?section=appearance',
  })
  
  items.push({
    id: 'appearance-theme',
    section: translations.sections?.appearance || 'Appearance',
    title: translations.appearance?.theme || 'Theme',
    description: translations.appearance?.themeDescription,
    keywords: ['theme', 'dark mode', 'light mode', 'system'],
    path: '/settings?section=appearance&focus=theme',
  })
  
  items.push({
    id: 'appearance-density',
    section: translations.sections?.appearance || 'Appearance',
    title: translations.appearance?.uiDensity || 'UI Density',
    description: translations.appearance?.uiDensityDescription,
    keywords: ['density', 'spacing', 'compact', 'comfortable', 'spacious'],
    path: '/settings?section=appearance&focus=density',
  })
  
  // Notifications
  items.push({
    id: 'notifications',
    section: translations.sections?.notifications || 'Notifications',
    title: translations.notifications?.title || 'Notifications',
    description: translations.notifications?.subtitle,
    keywords: ['notifications', 'email', 'alerts', 'browser', 'desktop'],
    path: '/settings?section=notifications',
  })
  
  // API & Integrations
  items.push({
    id: 'api',
    section: translations.sections?.api || 'API & Integrations',
    title: translations.api?.title || 'API & Integrations',
    description: translations.api?.description,
    keywords: ['api', 'gemini', 'ai', 'integrations', 'database'],
    path: '/settings?section=api',
  })
  
  items.push({
    id: 'api-gemini',
    section: translations.sections?.api || 'API & Integrations',
    title: translations.api?.geminiApiKey || 'Gemini API Configuration',
    description: 'Configure Gemini AI API settings',
    keywords: ['gemini', 'ai', 'api key', 'artificial intelligence'],
    path: '/settings?section=api&focus=gemini',
  })
  
  // System Preferences
  items.push({
    id: 'system',
    section: translations.sections?.system || 'System Preferences',
    title: translations.system?.title || 'System Preferences',
    description: translations.system?.subtitle,
    keywords: ['system', 'company', 'backup', 'limits', 'configuration'],
    path: '/settings?section=system',
  })
  
  items.push({
    id: 'system-company',
    section: translations.sections?.system || 'System Preferences',
    title: translations.system?.companyInfo || 'Company Information',
    description: 'Configure company details and branding',
    keywords: ['company', 'logo', 'name', 'timezone', 'fiscal year'],
    path: '/settings?section=system&focus=company',
  })
  
  items.push({
    id: 'system-backup',
    section: translations.sections?.system || 'System Preferences',
    title: translations.system?.backupSettings || 'Backup Settings',
    description: 'Configure automatic backup settings',
    keywords: ['backup', 'restore', 'retention', 'schedule'],
    path: '/settings?section=system&focus=backup',
  })
  
  return items
}
