'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginSchema, type LoginFormData } from '@/utils/validators'
import { Eye, EyeOff, Loader2, AlertTriangle, Lock } from 'lucide-react'
import Link from 'next/link'
import { SimpleCaptcha } from './SimpleCaptcha'

interface LoginFormProps {
  locale: string
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<LoginFormData & { rememberMe: boolean }>({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({})
  const [requiresCaptcha, setRequiresCaptcha] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutEndsAt, setLockoutEndsAt] = useState<Date | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)

  // Check security status when email changes
  useEffect(() => {
    const checkSecurityStatus = async () => {
      if (formData.email && formData.email.includes('@')) {
        try {
          const response = await fetch('/api/auth/security-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email }),
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              setRequiresCaptcha(result.data.requiresCaptcha)
              setIsLocked(result.data.isLocked)
              setLockoutEndsAt(result.data.lockoutEndsAt ? new Date(result.data.lockoutEndsAt) : null)
              setAttemptsRemaining(result.data.attemptsRemaining)
              
              // Reset captcha verification if requirements change
              if (!result.data.requiresCaptcha) {
                setCaptchaVerified(false)
              }
            }
          }
        } catch (error) {
          console.error('Failed to check security status:', error)
        }
      }
    }

    const debounceTimer = setTimeout(checkSecurityStatus, 500)
    return () => clearTimeout(debounceTimer)
  }, [formData.email])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleCaptchaVerify = (isValid: boolean) => {
    setCaptchaVerified(isValid)
    if (isValid) {
      toast.success('CAPTCHA verified successfully', {
        duration: 2000,
        position: 'top-center',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    // Check if account is locked
    if (isLocked) {
      toast.error('Account is locked. Please try again later.', {
        duration: 4000,
        position: 'top-center',
      })
      return
    }

    // Check CAPTCHA verification if required
    if (requiresCaptcha && !captchaVerified) {
      toast.error('Please complete the security check', {
        duration: 3000,
        position: 'top-center',
      })
      return
    }

    setIsLoading(true)

    try {
      // Validate form data with Zod
      const validatedData = loginSchema.parse({
        email: formData.email,
        password: formData.password,
      })

      // Attempt to sign in with NextAuth
      const result = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      })

      if (result?.error) {
        // Authentication failed - show specific error messages
        const errorMessage = t('errors.invalidCredentials') || 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        
        toast.error(errorMessage, {
          duration: 4000,
          position: 'top-center',
        })
        
        setErrors({ 
          email: ' ',
          password: errorMessage
        })

        // Reset captcha verification to require new verification
        setCaptchaVerified(false)

        // Refresh security status after failed attempt
        setTimeout(async () => {
          try {
            const response = await fetch('/api/auth/security-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email }),
            })
            
            if (response.ok) {
              const result = await response.json()
              if (result.success && result.data) {
                setRequiresCaptcha(result.data.requiresCaptcha)
                setIsLocked(result.data.isLocked)
                setLockoutEndsAt(result.data.lockoutEndsAt ? new Date(result.data.lockoutEndsAt) : null)
                setAttemptsRemaining(result.data.attemptsRemaining)
              }
            }
          } catch (error) {
            console.error('Failed to refresh security status:', error)
          }
        }, 500)
      } else if (result?.ok) {
        // Authentication successful - show success message
        const successMessage = t('auth.loginSuccess') || 'تم تسجيل الدخول بنجاح'
        
        toast.success(successMessage, {
          duration: 2000,
          position: 'top-center',
        })
        
        // Redirect to dashboard after short delay for better UX
        setTimeout(() => {
          router.push(`/${locale}/dashboard`)
          router.refresh()
        }, 500)
      }
    } catch (error: any) {
      // Handle Zod validation errors
      if (error.errors) {
        const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {}
        error.errors.forEach((err: any) => {
          const field = err.path[0] as keyof LoginFormData
          if (field) {
            // Provide user-friendly error messages
            if (field === 'email') {
              fieldErrors[field] = t('errors.invalidEmail') || 'البريد الإلكتروني غير صالح'
            } else if (field === 'password') {
              fieldErrors[field] = t('errors.passwordRequired') || 'كلمة المرور مطلوبة'
            } else {
              fieldErrors[field] = err.message
            }
          }
        })
        setErrors(fieldErrors)
        
        // Show toast for validation errors
        toast.error(t('errors.validationError') || 'يرجى التحقق من البيانات المدخلة', {
          duration: 3000,
          position: 'top-center',
        })
      } else {
        // Handle unexpected errors
        toast.error(t('errors.serverError') || 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى', {
          duration: 4000,
          position: 'top-center',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Locked Warning */}
      {isLocked && lockoutEndsAt && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
              Account Locked
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400">
              Your account has been temporarily locked due to multiple failed login attempts.
              It will be automatically unlocked at {lockoutEndsAt.toLocaleTimeString()}.
            </p>
          </div>
        </div>
      )}

      {/* Security Warning */}
      {!isLocked && attemptsRemaining !== null && attemptsRemaining <= 5 && attemptsRemaining > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
              Security Warning
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {attemptsRemaining} login {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining before account lockout.
            </p>
          </div>
        </div>
      )}

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('common.email')}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          disabled={isLoading}
          autoComplete="email"
          required
          className="w-full"
        />
      </div>

      {/* Password Input with Toggle */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('common.password')}
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.passwordPlaceholder')}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={isLoading}
            autoComplete="current-password"
            required
            className="w-full pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* CAPTCHA Challenge */}
      {requiresCaptcha && !isLocked && (
        <SimpleCaptcha 
          onVerify={handleCaptchaVerify}
          className="animate-in fade-in slide-in-from-top-2 duration-300"
        />
      )}

      {/* Remember Me and Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            disabled={isLoading}
            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {t('auth.rememberMe')}
          </span>
        </label>

        <Link
          href={`/${locale}/forgot-password`}
          className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
        >
          {t('auth.forgotPassword')}
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="large"
        disabled={isLoading || isLocked || (requiresCaptcha && !captchaVerified)}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            {t('common.loading')}
          </>
        ) : isLocked ? (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Account Locked
          </>
        ) : (
          t('auth.signIn')
        )}
      </Button>

      {/* Register Link */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t('auth.noAccount') || "Don't have an account?"}{' '}
        <Link
          href={`/${locale}/register`}
          className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
        >
          {t('auth.signUp') || 'Sign up'}
        </Link>
      </div>
    </form>
  )
}
