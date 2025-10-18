/**
 * Password utility functions for strength calculation, generation, and validation
 */

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4 // 0=very weak, 1=weak, 2=fair, 3=good, 4=strong
  feedback: string[]
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'
  color: string
}

/**
 * Calculate password strength based on various criteria
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      feedback: ['Password is required'],
      label: 'Very Weak',
      color: '#ef4444',
    }
  }

  let score = 0
  const feedback: string[] = []

  // Length check
  if (password.length >= 8) score++
  else feedback.push('Use at least 8 characters')

  if (password.length >= 12) score++

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  if (hasLowercase && hasUppercase) score++
  else if (!hasUppercase) feedback.push('Add uppercase letters')

  if (hasNumber) score++
  else feedback.push('Add numbers')

  if (hasSpecial) score++
  else feedback.push('Add special characters')

  // Common patterns to avoid
  const commonPatterns = [
    /^123/,
    /password/i,
    /qwerty/i,
    /abc/i,
    /111/,
    /000/,
  ]

  const hasCommonPattern = commonPatterns.some((pattern) => pattern.test(password))
  if (hasCommonPattern) {
    score = Math.max(0, score - 1)
    feedback.push('Avoid common patterns')
  }

  // Sequential characters
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeated characters')
  }

  // Cap score at 4
  score = Math.min(4, score) as 0 | 1 | 2 | 3 | 4

  // Determine label and color
  const labels: Record<number, PasswordStrength['label']> = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
  }

  const colors: Record<number, string> = {
    0: '#ef4444', // red
    1: '#f97316', // orange
    2: '#eab308', // yellow
    3: '#22c55e', // green
    4: '#10b981', // emerald
  }

  return {
    score,
    feedback: feedback.length > 0 ? feedback : ['Password looks good!'],
    label: labels[score],
    color: colors[score],
  }
}

/**
 * Validate password meets minimum requirements
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!password) {
    errors.push('Password is required')
    return { valid: false, errors }
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Generate a secure random password
 */
export function generatePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  const allChars = lowercase + uppercase + numbers + special

  // Ensure at least one of each type
  let password = ''
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Check if password matches confirmation
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0
}
