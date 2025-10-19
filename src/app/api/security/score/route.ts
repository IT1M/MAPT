import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { calculateSecurityScore, getSecurityScoreHistory } from '@/services/security-score'

/**
 * GET /api/security/score
 * Get security score for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const includeHistory = searchParams.get('history') === 'true'
    const historyDays = parseInt(searchParams.get('days') || '30')

    const score = await calculateSecurityScore(session.user.id)

    let history = undefined
    if (includeHistory) {
      history = await getSecurityScoreHistory(session.user.id, historyDays)
    }

    return NextResponse.json({
      success: true,
      data: {
        score,
        history
      }
    })
  } catch (error) {
    console.error('[Security Score] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate security score' },
      { status: 500 }
    )
  }
}
