'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginSchema, type LoginFormData } from '@/utils/validators'

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const t = useTranslations()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    try {
      // Validate form data with Zod
      const validatedData = loginSchema.parse(formData)

      // Attempt to sign in with NextAuth
      const result = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      })

      if (result?.error) {
        // Authentication failed - show specific error message
        toast.error(t('errors.invalidCredentials') || 'خطأ في معلومات الدخول')
      } else if (result?.ok) {
        // Authentication successful
        toast.success(t('auth.loginSuccess') || 'تم تسجيل الدخول بنجاح')
        
        // Get locale from params
        const { locale } = await params
        
        // Redirect to dashboard immediately
        router.push(`/${locale}/dashboard`)
        router.refresh()
      }
    } catch (error: any) {
      // Handle Zod validation errors
      if (error.errors) {
        const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {}
        error.errors.forEach((err: any) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginFormData] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        // Handle unexpected errors
        toast.error(t('errors.serverError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('common.appName')}
          </h1>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {t('auth.welcomeBack')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('auth.signInToContinue')}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-lg bg-white dark:bg-gray-800 px-6 py-8 shadow-md">
            {/* Email Input */}
            <Input
              id="email"
              name="email"
              type="email"
              label={t('common.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              disabled={isLoading}
              autoComplete="email"
              required
            />

            {/* Password Input */}
            <Input
              id="password"
              name="password"
              type="password"
              label={t('common.password')}
              placeholder={t('auth.passwordPlaceholder')}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={isLoading}
            className="w-full"
          >
            {t('auth.signIn')}
          </Button>
        </form>
      </div>
    </div>
  )
}
