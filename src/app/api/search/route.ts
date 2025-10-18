/**
 * Global Search API Endpoint
 * POST /api/search
 * 
 * Provides full-text search across inventory, reports, users, and settings
 * with role-based filtering and optimized performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { globalSearch } from '@/services/search-server'
import { searchSettings } from '@/services/search'
import { apiResponse } from '@/utils/api-response'

// Request validation schema
const searchSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(20).optional().default(5)
})

/**
 * POST /api/search
 * Perform global search
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        apiResponse.error('Authentication required', 'AUTH_REQUIRED'),
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = searchSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        apiResponse.error('Invalid request data', 'VALIDATION_ERROR', validation.error.errors),
        { status: 400 }
      )
    }

    const { query, limit } = validation.data

    // Perform search (database + settings)
    const dbResults = await globalSearch(
      query,
      session.user.id,
      session.user.role,
      limit
    )

    // Add settings search (client-side safe)
    const settingsResults = searchSettings(query, session.user.role, limit)

    const results = {
      ...dbResults,
      settings: settingsResults,
      total: dbResults.total + settingsResults.length
    }

    return NextResponse.json(
      apiResponse.success(results, 'Search completed successfully'),
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60' // Cache for 1 minute
        }
      }
    )
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      apiResponse.error('Failed to perform search', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
