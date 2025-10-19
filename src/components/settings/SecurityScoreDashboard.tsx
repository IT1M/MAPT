'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface SecurityScore {
  total: number
  factors: {
    passwordStrength: number
    twoFactorEnabled: number
    activeSessions: number
    recentSecurityEvents: number
    lastPasswordChange: number
  }
  level: 'critical' | 'low' | 'medium' | 'good' | 'excellent'
  recommendations: string[]
  color: string
}

export default function SecurityScoreDashboard() {
  const [score, setScore] = useState<SecurityScore | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSecurityScore()
  }, [])

  const fetchSecurityScore = async () => {
    try {
      const response = await fetch('/api/security/score')
      const data = await response.json()

      if (data.success) {
        setScore(data.data.score)
      }
    } catch (error) {
      toast.error('Failed to load security score')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    )
  }

  if (!score) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load security score
      </div>
    )
  }

  const getLevelBadge = () => {
    const badges = {
      excellent: { text: 'Excellent', icon: '🛡️', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
      good: { text: 'Good', icon: '✅', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200' },
      medium: { text: 'Medium', icon: '⚠️', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200' },
      low: { text: 'Low', icon: '⚠️', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
      critical: { text: 'Critical', icon: '🚨', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' }
    }
    return badges[score.level]
  }

  const badge = getLevelBadge()

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Security Score
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your account security rating
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full ${badge.bg}`}>
            <span className={`font-semibold ${badge.text}`}>
              {badge.icon} {badge.text}
            </span>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="text-6xl font-bold" style={{ color: score.color }}>
            {score.total}
          </div>
          <div className="text-2xl text-gray-500 dark:text-gray-400 mb-2">
            / 100
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${score.total}%`,
              backgroundColor: score.color
            }}
          />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Score Breakdown
        </h4>

        <div className="space-y-4">
          {Object.entries(score.factors).map(([key, value]) => {
            const maxValues: Record<string, number> = {
              passwordStrength: 30,
              twoFactorEnabled: 25,
              activeSessions: 15,
              recentSecurityEvents: 15,
              lastPasswordChange: 15
            }

            const labels: Record<string, string> = {
              passwordStrength: 'Password Strength',
              twoFactorEnabled: 'Two-Factor Authentication',
              activeSessions: 'Active Sessions',
              recentSecurityEvents: 'Security Events',
              lastPasswordChange: 'Password Age'
            }

            const max = maxValues[key]
            const percentage = (value / max) * 100

            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">
                    {labels[key]}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {value} / {max}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Security Recommendations
          </h4>

          <div className="space-y-3">
            {score.recommendations.map((recommendation, index) => {
              const isHighPriority = recommendation.includes('immediately') || 
                                     recommendation.includes('Enable two-factor')
              
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    isHighPriority
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <span className="text-lg">
                    {isHighPriority ? '🚨' : '💡'}
                  </span>
                  <p className={`text-sm ${
                    isHighPriority
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {recommendation}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
