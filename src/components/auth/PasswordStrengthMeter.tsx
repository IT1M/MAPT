'use client'

interface PasswordStrengthMeterProps {
  password: string
}

export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong'

export function calculatePasswordStrength(password: string): {
  strength: PasswordStrength
  score: number
} {
  let score = 0

  if (!password) {
    return { strength: 'weak', score: 0 }
  }

  // Length check
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1 // lowercase
  if (/[A-Z]/.test(password)) score += 1 // uppercase
  if (/\d/.test(password)) score += 1 // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 1 // special characters

  // Determine strength based on score
  let strength: PasswordStrength
  if (score <= 2) {
    strength = 'weak'
  } else if (score <= 4) {
    strength = 'medium'
  } else if (score <= 5) {
    strength = 'strong'
  } else {
    strength = 'very-strong'
  }

  return { strength, score }
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { strength, score } = calculatePasswordStrength(password)

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'strong':
        return 'bg-green-500'
      case 'very-strong':
        return 'bg-emerald-600'
      default:
        return 'bg-gray-300'
    }
  }

  const getStrengthText = () => {
    switch (strength) {
      case 'weak':
        return 'Weak'
      case 'medium':
        return 'Medium'
      case 'strong':
        return 'Strong'
      case 'very-strong':
        return 'Very Strong'
      default:
        return ''
    }
  }

  const getStrengthWidth = () => {
    return `${(score / 7) * 100}%`
  }

  if (!password) {
    return null
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Password Strength:
        </span>
        <span className={`text-xs font-medium ${
          strength === 'weak' ? 'text-red-600 dark:text-red-400' :
          strength === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
          strength === 'strong' ? 'text-green-600 dark:text-green-400' :
          'text-emerald-600 dark:text-emerald-400'
        }`}>
          {getStrengthText()}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: getStrengthWidth() }}
        />
      </div>
    </div>
  )
}
