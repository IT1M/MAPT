'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Card } from '@/components/ui/card'
import { User, UserRole } from '@prisma/client'
import { USER_ROLE_LABELS } from '@/utils/constants'
import toast from 'react-hot-toast'
import { ProfileSettings } from '@/components/settings/ProfileSettings'

type UserWithoutPassword = Omit<User, 'passwordHash'>

export default function SettingsPage() {
  const t = useTranslations()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserWithoutPassword[]>([])
  
  // Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithoutPassword | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserWithoutPassword | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string
    email: string
    password: string
    role: UserRole
  }>({
    name: '',
    email: '',
    password: '',
    role: UserRole.DATA_ENTRY,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const locale = typeof window !== 'undefined' ? 
    document.documentElement.lang || 'en' : 'en'

  // Environment variables (sanitized)
  const envVars = [
    { key: 'NODE_ENV', value: process.env.NODE_ENV || 'development' },
    { key: 'NEXTAUTH_URL', value: process.env.NEXT_PUBLIC_APP_URL || 'Not set' },
    { key: 'DATABASE_URL', value: '••••••••' },
    { key: 'NEXTAUTH_SECRET', value: '••••••••' },
    { key: 'GEMINI_API_KEY', value: '••••••••' },
  ]

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      const result = await response.json()

      if (result.success) {
        setUsers(result.data)
      } else {
        toast.error(result.error?.message || t('errors.serverError'))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(t('errors.networkError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: UserRole.DATA_ENTRY,
    })
    setFormErrors({})
    setIsUserModalOpen(true)
  }

  const handleEditUser = (user: UserWithoutPassword) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    })
    setFormErrors({})
    setIsUserModalOpen(true)
  }

  const handleDeleteUser = (user: UserWithoutPassword) => {
    setDeletingUser(user)
    setIsDeleteModalOpen(true)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = t('errors.required')
    }

    if (!formData.email.trim()) {
      errors.email = t('errors.required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('errors.invalidEmail')
    }

    if (!editingUser && !formData.password) {
      errors.password = t('errors.required')
    } else if (formData.password && formData.password.length < 8) {
      errors.password = t('errors.invalidPassword')
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const body: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }

      if (formData.password) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editingUser ? t('success.updated') : t('success.created'))
        setIsUserModalOpen(false)
        fetchUsers()
      } else {
        toast.error(result.error?.message || t('errors.serverError'))
      }
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(t('errors.networkError'))
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deletingUser) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success(t('success.deleted'))
        setIsDeleteModalOpen(false)
        setDeletingUser(null)
        fetchUsers()
      } else {
        toast.error(result.error?.message || t('errors.serverError'))
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(t('errors.networkError'))
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRoleLabel = (role: UserRole) => {
    return USER_ROLE_LABELS[role][locale as 'en' | 'ar']
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('navigation.settings')}
        </h1>
      </div>

      {/* Profile Settings Section */}
      {session?.user?.id && (
        <div className="mb-6">
          <ProfileSettings userId={session.user.id} />
        </div>
      )}

      {/* System Configuration Section */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('settings.systemConfiguration')}
          </h2>
          <div className="space-y-3">
            {envVars.map((env) => (
              <div
                key={env.key}
                className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {env.key}
                </span>
                <span className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                  {env.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* User Management Section */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t('settings.userManagement')}
            </h2>
            <Button onClick={handleAddUser}>
              {t('settings.addUser')}
            </Button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {t('common.loading')}
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {t('settings.noUsers')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('common.name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('common.email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('settings.role')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('settings.createdAt')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.name}
                        {session?.user?.id === user.id && (
                          <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">
                            ({t('settings.you')})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {getRoleLabel(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => handleEditUser(user)}
                          >
                            {t('common.edit')}
                          </Button>
                          <Button
                            size="small"
                            variant="danger"
                            onClick={() => handleDeleteUser(user)}
                            disabled={session?.user?.id === user.id}
                          >
                            {t('common.delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* User Form Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? t('settings.editUser') : t('settings.addUser')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.name')} *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              placeholder={t('settings.enterName')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.email')} *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              placeholder={t('settings.enterEmail')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.password')} {editingUser ? `(${t('settings.leaveBlankToKeep')})` : '*'}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
              placeholder={t('settings.enterPassword')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.role')} *
            </label>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={[
                { value: UserRole.ADMIN, label: getRoleLabel(UserRole.ADMIN) },
                { value: UserRole.DATA_ENTRY, label: getRoleLabel(UserRole.DATA_ENTRY) },
                { value: UserRole.SUPERVISOR, label: getRoleLabel(UserRole.SUPERVISOR) },
                { value: UserRole.MANAGER, label: getRoleLabel(UserRole.MANAGER) },
                { value: UserRole.AUDITOR, label: getRoleLabel(UserRole.AUDITOR) },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsUserModalOpen(false)}
              disabled={submitting}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('settings.deleteUser')}
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            {t('settings.deleteUserConfirm', { name: deletingUser?.name })}
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={submitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={submitting}
            >
              {submitting ? t('common.loading') : t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
