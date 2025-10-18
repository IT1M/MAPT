import { NextRequest } from 'next/server'
import { z } from 'zod'
import { geminiService } from '@/services/gemini'
import { checkAuth } from '@/middleware/auth'
import { successResponse, handleApiError, validationError } from '@/utils/api-response'

// In-memory cache for Q&A responses (5-minute TTL)
interface CacheEntry {
  data: any
  timestamp: number
}

const qaCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Request validation schema
const aiQuestionSchema = z.object({
  question: z.string().min(3).max(500),
  context: z.object({
    totalItems: z.number(),
    totalQuantity: z.number(),
    recentActivity: z
      .array(
        z.object({
          itemName: z.string(),
          quantity: z.number(),
          destination: z.string(),
          date: z.string(),
        })
      )
      .optional(),
    lowStockItems: z
      .array(
        z.object({
          itemName: z.string(),
          currentStock: z.number(),
          reorderPoint: z.number(),
        })
      )
      .optional(),
    topCategories: z
      .array(
        z.object({
          category: z.string(),
          count: z.number(),
        })
      )
      .optional(),
  }),
})

/**
 * POST /api/analytics/ai-question
 * 
 * Handles conversational AI questions about analytics data
 * 
 * Request Body:
 * - question: User's question (3-500 characters)
 * - context: Dashboard context with inventory data
 * 
 * Returns:
 * - question: The original question
 * - answer: AI-generated answer
 * - confidence: Confidence score (0-1)
 * - sources: Array of data sources used (optional)
 * 
 * Implements 5-minute caching for identical questions
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context: authContext } = authResult

    // Parse and validate request body
    const body = await request.json()
    const validationResult = aiQuestionSchema.safeParse(body)

    if (!validationResult.success) {
      return validationError('Invalid request body', validationResult.error.errors)
    }

    const { question, context } = validationResult.data

    // Generate cache key (include user role for role-specific answers)
    const cacheKey = `ai-question:${authContext.user.role}:${question}:${context.totalItems}:${context.totalQuantity}`

    // Check cache
    const cached = qaCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return successResponse(cached.data)
    }

    // Check if Gemini service is available
    if (!geminiService.isAvailable()) {
      // Provide basic fallback response
      const fallbackAnswer = generateFallbackAnswer(question, context)
      
      const responseData = {
        question,
        answer: fallbackAnswer.answer,
        confidence: fallbackAnswer.confidence,
        sources: fallbackAnswer.sources,
      }

      // Cache fallback response
      qaCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
      })

      return successResponse(responseData)
    }

    // Call Gemini service
    const inventoryContext = {
      totalItems: context.totalItems,
      totalQuantity: context.totalQuantity,
      recentActivity: context.recentActivity || [],
      lowStockItems: context.lowStockItems,
      topCategories: context.topCategories,
    }
    const qaResponse = await geminiService.askQuestion(question, inventoryContext)

    const responseData = {
      question: qaResponse.question,
      answer: qaResponse.answer,
      confidence: qaResponse.confidence,
      sources: qaResponse.sources,
    }

    // Cache the result
    qaCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    })

    return successResponse(responseData)
  } catch (error) {
    // Handle Gemini-specific errors gracefully
    if (error instanceof Error && error.message.includes('Gemini')) {
      const body = await request.json()
      const fallbackAnswer = generateFallbackAnswer(body.question, body.context)
      
      return successResponse({
        question: body.question,
        answer: fallbackAnswer.answer,
        confidence: fallbackAnswer.confidence,
        sources: fallbackAnswer.sources,
        fallback: true,
      })
    }

    return handleApiError(error)
  }
}

/**
 * Generate a basic fallback answer when AI service is unavailable
 */
function generateFallbackAnswer(
  question: string,
  context: any
): { answer: string; confidence: number; sources?: string[] } {
  const lowerQuestion = question.toLowerCase()
  let answer = ''
  let confidence = 0.4
  const sources: string[] = []

  // Total/count questions
  if (lowerQuestion.includes('total') || lowerQuestion.includes('how many')) {
    answer = `Based on the current data, there are ${context.totalItems} inventory items with a total quantity of ${context.totalQuantity} units.`
    sources.push('Total inventory count')
    confidence = 0.9
  }
  // Low stock questions
  else if (lowerQuestion.includes('low stock') || lowerQuestion.includes('reorder')) {
    if (context.lowStockItems && context.lowStockItems.length > 0) {
      const itemsList = context.lowStockItems
        .slice(0, 3)
        .map((item: any) => `${item.itemName} (${item.currentStock}/${item.reorderPoint})`)
        .join(', ')
      answer = `There are ${context.lowStockItems.length} items with low stock levels: ${itemsList}${
        context.lowStockItems.length > 3 ? ', and more' : ''
      }.`
      sources.push('Low stock items list')
      confidence = 0.9
    } else {
      answer = 'All items appear to have adequate stock levels at this time.'
      sources.push('Stock level analysis')
      confidence = 0.8
    }
  }
  // Recent activity questions
  else if (lowerQuestion.includes('recent') || lowerQuestion.includes('activity')) {
    if (context.recentActivity && context.recentActivity.length > 0) {
      const activityList = context.recentActivity
        .slice(0, 3)
        .map((item: any) => `${item.itemName} (${item.quantity} units to ${item.destination})`)
        .join(', ')
      answer = `Recent inventory activity includes: ${activityList}${
        context.recentActivity.length > 3 ? ', and more' : ''
      }.`
      sources.push('Recent activity log')
      confidence = 0.9
    } else {
      answer = 'No recent activity data is available.'
      confidence = 0.5
    }
  }
  // Category questions
  else if (lowerQuestion.includes('category') || lowerQuestion.includes('categories')) {
    if (context.topCategories && context.topCategories.length > 0) {
      const categoryList = context.topCategories
        .map((cat: any) => `${cat.category} (${cat.count} items)`)
        .join(', ')
      answer = `Top categories by item count: ${categoryList}.`
      sources.push('Category breakdown')
      confidence = 0.9
    } else {
      answer = 'Category information is not available at this time.'
      confidence = 0.3
    }
  }
  // Reject rate questions
  else if (lowerQuestion.includes('reject') || lowerQuestion.includes('quality')) {
    answer =
      'To analyze reject rates, please refer to the Reject Analysis chart on the dashboard. It shows trends over time and highlights periods with high reject rates.'
    sources.push('Dashboard charts')
    confidence = 0.6
  }
  // Trend questions
  else if (lowerQuestion.includes('trend') || lowerQuestion.includes('pattern')) {
    answer =
      'For detailed trend analysis, please review the Inventory Trend chart and Monthly Comparison chart on the dashboard. These visualizations show patterns over time.'
    sources.push('Dashboard charts')
    confidence = 0.6
  }
  // Improvement/optimization questions
  else if (
    lowerQuestion.includes('improve') ||
    lowerQuestion.includes('optimize') ||
    lowerQuestion.includes('better')
  ) {
    answer =
      'To improve inventory efficiency, consider: 1) Monitoring items with high reject rates, 2) Balancing distribution between warehouses, 3) Maintaining optimal stock levels, and 4) Reviewing category performance regularly.'
    sources.push('Best practices')
    confidence = 0.5
  }
  // Default response
  else {
    answer = `I apologize, but I'm currently unable to provide a detailed answer to your question. However, I can help you with information about: total inventory counts, low stock items, recent activity, categories, reject rates, and trends. Please try rephrasing your question or refer to the dashboard charts for visual insights.`
    confidence = 0.3
  }

  return { answer, confidence, sources: sources.length > 0 ? sources : undefined }
}
