'use client'

import { useState, useEffect } from 'react'
import { AvatarUpload } from './AvatarUpload'
import { ProfileForm } from './ProfileForm'
import { UserProfile } from '@/types/settings'
import { toast } from 'react-hot-toast'

interface ProfileSettingsProps {
  userId: string
}

export function ProfileSettings({ userId }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/users/profile')
        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }
        const data = await response.json()
        setProfile(data.data)
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  // Handle profile update
  const handleProfileUpdate = async (data: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const result = await response.json()
      setProfile(result.data)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await fetch('/api/users/avatar', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload avatar')
    }

    const result = await response.json()
    setProfile((prev) => (prev ? { ...prev, avatar: result.data.avatarUrl } : null))
    return result.data.avatarUrl
  }

  // Handle avatar removal
  const handleAvatarRemove = async () => {
    const response = await fetch('/api/users/avatar', {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to remove avatar')
    }

    setProfile((prev) => (prev ? { ...prev, avatar: undefined } : null))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Profile Picture
        </h2>
        <AvatarUpload
          currentAvatar={profile.avatar}
          userName={profile.name}
          onUpload={handleAvatarUpload}
          onRemove={handleAvatarRemove}
        />
      </div>

      {/* Profile Form Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <ProfileForm profile={profile} onUpdate={handleProfileUpdate} />
      </div>
    </div>
  )
}
