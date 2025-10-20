'use client';

import React, { useState, useEffect } from 'react';
import { UserRole } from '@prisma/client';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UserWithStatus } from './UserTable';

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  sendWelcomeEmail: boolean;
}

export interface UserModalProps {
  user?: UserWithStatus;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
}

export function UserModal({ user, isOpen, onClose, onSubmit }: UserModalProps) {
  const isEditMode = !!user;
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: UserRole.DATA_ENTRY,
    isActive: true,
    sendWelcomeEmail: true,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof UserFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          password: '',
          role: user.role,
          isActive: user.isActive,
          sendWelcomeEmail: false,
        });
        setGeneratedPassword('');
      } else {
        const newPassword = generatePassword();
        setFormData({
          name: '',
          email: '',
          password: newPassword,
          role: UserRole.DATA_ENTRY,
          isActive: true,
          sendWelcomeEmail: true,
        });
        setGeneratedPassword(newPassword);
      }
      setErrors({});
      setShowPassword(false);
    }
  }, [isOpen, user]);

  const generatePassword = () => {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setGeneratedPassword(newPassword);
    setFormData((prev) => ({ ...prev, password: newPassword }));
    setShowPassword(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!isEditMode || formData.password) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password =
          'Password must contain at least one uppercase letter';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one number';
      } else if (!/[!@#$%^&*]/.test(formData.password)) {
        newErrors.password =
          'Password must contain at least one special character (!@#$%^&*)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      // Error handling should be done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    {
      value: UserRole.DATA_ENTRY,
      label: 'Data Entry - Can add and edit inventory items',
    },
    {
      value: UserRole.SUPERVISOR,
      label: 'Supervisor - Can manage inventory and view analytics',
    },
    {
      value: UserRole.MANAGER,
      label: 'Manager - Can view analytics and generate reports',
    },
    {
      value: UserRole.AUDITOR,
      label: 'Auditor - Can view audit logs and reports',
    },
    { value: UserRole.ADMIN, label: 'Admin - Full system access' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit User' : 'Create New User'}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Input
          label="Full Name"
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          error={errors.name}
          placeholder="John Doe"
          required
          autoFocus
        />

        {/* Email */}
        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          error={errors.email}
          placeholder="john.doe@example.com"
          required
          disabled={isEditMode}
          helperText={isEditMode ? 'Email cannot be changed' : undefined}
        />

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password {isEditMode && '(leave blank to keep current)'}
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                error={errors.password}
                placeholder={
                  isEditMode ? 'Leave blank to keep current' : 'Enter password'
                }
                required={!isEditMode}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPassword(!showPassword)}
              className="px-3"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </Button>
          </div>
          {!isEditMode && (
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={handleGeneratePassword}
              >
                Generate Password
              </Button>
              {generatedPassword && (
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => copyToClipboard(generatedPassword)}
                >
                  Copy Password
                </Button>
              )}
            </div>
          )}
          {!isEditMode && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Password must be at least 8 characters with uppercase, number, and
              special character
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                role: e.target.value as UserRole,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            required
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
            }
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label
            htmlFor="isActive"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Active (user can log in)
          </label>
        </div>

        {/* Send Welcome Email */}
        {!isEditMode && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sendWelcomeEmail"
              checked={formData.sendWelcomeEmail}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sendWelcomeEmail: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label
              htmlFor="sendWelcomeEmail"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Send welcome email with login credentials
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {isEditMode ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
