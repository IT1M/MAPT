'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { PasswordRequirementsChecklist } from './PasswordRequirementsChecklist'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { z } from 'zod'

interface RegistrationFormProps {
  locale: string
}

// Registration schema with confirm password
const registrationFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z
    .string()
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegistrationFormData = z.infer<typeof registrationFormSchema>

export function RegistrationForm({ locale }: RegistrationFormProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [emailCheckLoading, setEmailCheckLoading] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationFormData, string>>>({})

  // Debounced email uniqueness check
  useEffect(() => {
    const checkEmailUniqueness = async () => {
      if (!formData.email || !formData.email.includes('@')) {
        setEmailAvailable(null)
        return
      }

      setEmailCheckLoading(true)
      try {
        const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(formData.email)}`)
        const data = await response.json()
        setEmailAvailable(data.available)
      } catch (error) {
        console.error('Email check failed:', error)
        setEmailAvailable(null)
      } finally {
        setEmailCheckLoading(false)
      }
    }

    const timeoutId = setTimeout(checkEmailUniqueness, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.email])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof RegistrationFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    try {
      // Validate form data with Zod
      const validatedData = registrationFormSchema.parse(formData)

      // Check if email is available
      if (emailAvailable === false) {
        setErrors({ email: 'This email is already registered' })
        setIsLoading(false)
        return
      }

      // Register user via API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: validatedData.name,
          email: validatedData.email,
          password: validatedData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          const fieldErrors: Partial<Record<keyof RegistrationFormData, string>> = {}
          data.errors.forEach((err: any) => {
            if (err.field) {
              fieldErrors[err.field as keyof RegistrationFormData] = err.message
            }
          })
          setErrors(fieldErrors)
        } else {
          toast.error(data.message || 'Registration failed')
        }
        setIsLoading(false)
        return
      }

      // Registration successful - auto-login
      toast.success('Registration successful! Logging you in...')
      
      const signInResult = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        router.push(`/${locale}/dashboard`)
        router.refresh()
      } else {
        // If auto-login fails, redirect to login page
        toast.success('Registration successful! Please log in.')
        router.push(`/${locale}/login`)
      }
    } catch (error: any) {
      // Handle Zod validation errors
      if (error.errors) {
        const fieldErrors: Partial<Record<keyof RegistrationFormData, string>> = {}
        error.errors.forEach((err: any) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RegistrationFormData] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        toast.error('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name Input */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            disabled={isLoading}
            autoComplete="name"
            required
            className="w-full"
          />
        </div>

        {/* Email Input with availability check */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common.email')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
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
            {emailCheckLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
            {!emailCheckLoading && emailAvailable === false && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>
          {emailAvailable === false && !errors.email && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              This email is already registered
            </p>
          )}
        </div>

        {/* Phone Input (Optional) */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number <span className="text-xs text-gray-500">(Optional)</span>
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            disabled={isLoading}
            autoComplete="tel"
            className="w-full"
          />
        </div>

        {/* Password Input with strength meter */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common.password')} <span className="text-red-500">*</span>
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
              autoComplete="new-password"
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
          <PasswordStrengthMeter password={formData.password} />
          <PasswordRequirementsChecklist password={formData.password} />
        </div>

        {/* Confirm Password Input */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              disabled={isLoading}
              autoComplete="new-password"
              required
              className="w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Terms & Conditions Checkbox */}
        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              disabled={isLoading}
              className="w-4 h-4 mt-0.5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I accept the{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium underline"
              >
                Terms & Conditions
              </button>
              {' '}<span className="text-red-500">*</span>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.acceptTerms}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="large"
          disabled={isLoading || emailAvailable === false}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>

        {/* Login Link */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            href={`/${locale}/login`}
            className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
          >
            {t('auth.signIn')}
          </Link>
        </div>
      </form>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Terms & Conditions
              </h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose dark:prose-invert max-w-none">
                <h3>1. Acceptance of Terms</h3>
                <p>
                  By accessing and using the Saudi Mais Medical Inventory System, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
                
                <h3>2. Use License</h3>
                <p>
                  Permission is granted to temporarily access the system for personal, non-transferable use only. This is the grant of a license, not a transfer of title.
                </p>
                
                <h3>3. User Responsibilities</h3>
                <p>
                  Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.
                </p>
                
                <h3>4. Data Privacy</h3>
                <p>
                  We are committed to protecting your privacy. All personal information collected will be handled in accordance with applicable data protection laws.
                </p>
                
                <h3>5. Prohibited Activities</h3>
                <p>
                  Users must not attempt to gain unauthorized access to the system, interfere with system operations, or use the system for any unlawful purpose.
                </p>
                
                <h3>6. Limitation of Liability</h3>
                <p>
                  The system is provided "as is" without warranties of any kind. We shall not be liable for any damages arising from the use or inability to use the system.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowTermsModal(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setFormData(prev => ({ ...prev, acceptTerms: true }))
                  setShowTermsModal(false)
                  setErrors(prev => ({ ...prev, acceptTerms: undefined }))
                }}
              >
                Accept Terms
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
