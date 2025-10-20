'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/settings';
import { profileSchema } from '@/utils/settings-validation';
import { useAutoSave } from '@/hooks/useAutosave';
import { toast } from 'react-hot-toast';

interface ProfileFormProps {
  profile: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => Promise<void>;
}

interface FormData {
  name: string;
  employeeId: string;
  department: string;
  phoneNumber: string;
  workLocation: string;
}

interface FormErrors {
  name?: string;
  phoneNumber?: string;
}

export function ProfileForm({ profile, onUpdate }: ProfileFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: profile.name || '',
    employeeId: profile.employeeId || '',
    department: profile.department || '',
    phoneNumber: profile.phoneNumber || '',
    workLocation: profile.workLocation || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save functionality
  const { status: saveStatus } = useAutoSave({
    data: formData,
    onSave: async (data) => {
      // Validate before saving
      const validation = profileSchema.safeParse(data);
      if (!validation.success) {
        const fieldErrors: FormErrors = {};
        validation.error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        throw new Error('Validation failed');
      }

      setErrors({});
      await onUpdate(data);
    },
    delay: 500,
    enabled: true,
  });

  // Update form data when profile changes
  useEffect(() => {
    setFormData({
      name: profile.name || '',
      employeeId: profile.employeeId || '',
      department: profile.department || '',
      phoneNumber: profile.phoneNumber || '',
      workLocation: profile.workLocation || '',
    });
  }, [profile]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleManualSave = async () => {
    try {
      setIsSaving(true);
      const validation = profileSchema.safeParse(formData);

      if (!validation.success) {
        const fieldErrors: FormErrors = {};
        validation.error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        toast.error('Please fix validation errors');
        return;
      }

      setErrors({});
      await onUpdate(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      SUPERVISOR:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      MANAGER:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      DATA_ENTRY:
        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      AUDITOR:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[role] || colors.DATA_ENTRY;
  };

  return (
    <div className="space-y-6">
      {/* Save Status Indicator */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Profile Information
        </h3>
        <div
          className="flex items-center gap-2"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {saveStatus === 'saving' && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-sm text-green-600 dark:text-green-400">
              ✓ Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-600 dark:text-red-400">
              ✗ Error
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="md:col-span-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Full Name{' '}
            <span className="text-red-500" aria-label="required">
              *
            </span>
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[44px] ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
            required
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p
              id="name-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.name}
            </p>
          )}
        </div>

        {/* Email (Read-only) */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={profile.email}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed min-h-[44px]"
            aria-readonly="true"
            aria-describedby="email-help"
          />
          <p
            id="email-help"
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            Email cannot be changed
          </p>
        </div>

        {/* Role (Read-only with badge) */}
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Role
          </label>
          <div className="flex items-center h-10">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
                profile.role
              )}`}
            >
              {profile.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Employee ID */}
        <div>
          <label
            htmlFor="employeeId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Employee ID
          </label>
          <input
            id="employeeId"
            type="text"
            value={formData.employeeId}
            onChange={(e) => handleChange('employeeId', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[44px]"
            placeholder="e.g., EMP001"
            aria-label="Employee ID"
          />
        </div>

        {/* Department */}
        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Department
          </label>
          <input
            id="department"
            type="text"
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[44px]"
            placeholder="e.g., Inventory Management"
            aria-label="Department"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[44px] ${
              errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+1234567890"
            aria-invalid={!!errors.phoneNumber}
            aria-describedby={errors.phoneNumber ? 'phone-error' : undefined}
          />
          {errors.phoneNumber && (
            <p
              id="phone-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.phoneNumber}
            </p>
          )}
        </div>

        {/* Work Location */}
        <div>
          <label
            htmlFor="workLocation"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Work Location
          </label>
          <input
            id="workLocation"
            type="text"
            value={formData.workLocation}
            onChange={(e) => handleChange('workLocation', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[44px]"
            placeholder="e.g., Main Office"
            aria-label="Work Location"
          />
        </div>
      </div>

      {/* Manual Save Button - Sticky on mobile */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 md:static sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-900 p-4 md:p-0 -mx-4 md:mx-0 -mb-4 md:mb-0 shadow-lg md:shadow-none z-10">
        <button
          type="button"
          onClick={handleManualSave}
          disabled={isSaving || saveStatus === 'saving'}
          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Save profile changes"
        >
          {isSaving || saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
