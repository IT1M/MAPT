'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface TwoFactorSetupProps {
  onComplete?: () => void
}

export default function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'initial' | 'scan' | 'verify' | 'backup'>('initial')
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSetup = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to setup 2FA')
      }

      setQrCode(data.data.qrCode)
      setSecret(data.data.secret)
      setBackupCodes(data.data.backupCodes)
      setStep('scan')
    } catch (error: any) {
      toast.error(error.message || 'Failed to setup 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Invalid verification code')
      }

      toast.success('2FA enabled successfully!')
      setStep('backup')
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    onComplete?.()
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    toast.success('Backup codes copied to clipboard')
  }

  if (step === 'initial') {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🛡️ Enable Two-Factor Authentication
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
            Add an extra layer of security to your account by requiring a verification code from your phone in addition to your password.
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 mb-4">
            <li>• Download an authenticator app (Google Authenticator, Authy, etc.)</li>
            <li>• Scan the QR code with your app</li>
            <li>• Enter the verification code to confirm</li>
            <li>• Save your backup codes in a safe place</li>
          </ul>
        </div>

        <button
          onClick={handleSetup}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Setting up...' : 'Start Setup'}
        </button>
      </div>
    )
  }

  if (step === 'scan') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2">Scan QR Code</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Open your authenticator app and scan this QR code
          </p>

          {qrCode && (
            <div className="flex justify-center mb-4">
              <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
            </div>
          )}

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Can't scan? Enter this code manually:
            </p>
            <code className="text-sm font-mono">{secret}</code>
          </div>
        </div>

        <button
          onClick={() => setStep('verify')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Continue to Verification
        </button>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">Enter Verification Code</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Enter the 6-digit code from your authenticator app
          </p>

          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
            maxLength={6}
            autoFocus
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || verificationCode.length !== 6}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
        </button>
      </div>
    )
  }

  if (step === 'backup') {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
            ⚠️ Save Your Backup Codes
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
            Store these backup codes in a safe place. You can use them to access your account if you lose your phone.
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="font-mono text-sm bg-white dark:bg-gray-700 px-3 py-2 rounded border border-gray-300 dark:border-gray-600"
              >
                {code}
              </div>
            ))}
          </div>

          <button
            onClick={copyBackupCodes}
            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            📋 Copy All Codes
          </button>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✅ Two-factor authentication is now enabled on your account!
          </p>
        </div>

        <button
          onClick={handleComplete}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    )
  }

  return null
}
