import { z } from 'zod';
import { UserRole, Destination } from '@prisma/client';

// ============================================================================
// Profile Validation Schemas
// ============================================================================

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  workLocation: z.string().optional(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const avatarUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be a JPEG, PNG, or WebP image'
    ),
});

// ============================================================================
// User Management Validation Schemas
// ============================================================================

export const userFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    )
    .optional(),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean().default(true),
  sendWelcomeEmail: z.boolean().default(false),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  workLocation: z.string().optional(),
});

export const bulkUserActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'changeRole', 'delete']),
  userIds: z.array(z.string()).min(1, 'At least one user must be selected'),
  data: z
    .object({
      role: z.nativeEnum(UserRole).optional(),
    })
    .optional(),
});

// ============================================================================
// Preferences Validation Schemas
// ============================================================================

export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  uiDensity: z.enum(['compact', 'comfortable', 'spacious']),
  fontSize: z.number().min(12).max(20),
  colorScheme: z
    .object({
      primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
      accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    })
    .optional(),
  notifications: z.object({
    email: z.object({
      dailyInventorySummary: z.boolean(),
      weeklyAnalyticsReport: z.boolean(),
      newUserRegistration: z.boolean(),
      highRejectRateAlert: z.boolean(),
      systemUpdates: z.boolean(),
      backupStatus: z.boolean(),
    }),
    inApp: z.object({
      enabled: z.boolean(),
      sound: z.boolean(),
      desktop: z.boolean(),
    }),
    frequency: z.enum(['realtime', 'hourly', 'daily', 'custom']),
  }),
  sidebarCollapsed: z.boolean(),
  sidebarPosition: z.enum(['left', 'right']),
  showBreadcrumbs: z.boolean(),
});

export const notificationPreferencesSchema = z.object({
  email: z.object({
    dailyInventorySummary: z.boolean(),
    weeklyAnalyticsReport: z.boolean(),
    newUserRegistration: z.boolean(),
    highRejectRateAlert: z.boolean(),
    systemUpdates: z.boolean(),
    backupStatus: z.boolean(),
  }),
  inApp: z.object({
    enabled: z.boolean(),
    sound: z.boolean(),
    desktop: z.boolean(),
  }),
  frequency: z.enum(['realtime', 'hourly', 'daily', 'custom']),
});

// ============================================================================
// System Configuration Validation Schemas
// ============================================================================

export const companyInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  logo: z.string().url('Invalid logo URL').optional(),
  fiscalYearStart: z.number().min(1).max(12),
  timezone: z.string().min(1, 'Timezone is required'),
});

export const inventorySettingsSchema = z.object({
  defaultDestination: z.nativeEnum(Destination).nullable(),
  categoriesEnabled: z.boolean(),
  predefinedCategories: z.array(z.string()),
  autoBatchNumbers: z.boolean(),
  batchNumberPattern: z.string().optional(),
  supervisorApproval: z.boolean(),
  approvalThreshold: z.number().min(0).optional(),
});

export const backupConfigSchema = z.object({
  enabled: z.boolean(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  retentionDays: z.number().min(1).max(365),
  format: z
    .array(z.enum(['CSV', 'JSON', 'SQL']))
    .min(1, 'At least one format must be selected'),
});

export const systemLimitsSchema = z.object({
  maxItemsPerUserPerDay: z
    .number()
    .min(1, 'Must be at least 1')
    .max(10000, 'Must not exceed 10,000'),
  maxFileUploadSizeMB: z
    .number()
    .min(1, 'Must be at least 1 MB')
    .max(100, 'Must not exceed 100 MB'),
  sessionTimeoutMinutes: z
    .number()
    .min(5, 'Must be at least 5 minutes')
    .max(1440, 'Must not exceed 1440 minutes (24 hours)'),
  maxLoginAttempts: z
    .number()
    .min(1, 'Must be at least 1')
    .max(10, 'Must not exceed 10'),
  rateLimitPerMinute: z
    .number()
    .min(10, 'Must be at least 10')
    .max(1000, 'Must not exceed 1000'),
});

export const geminiConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  model: z.string().min(1, 'Model is required'),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().min(1).max(100000),
  cacheInsightsDuration: z.number().min(0),
  features: z.object({
    insights: z.boolean(),
    predictiveAnalytics: z.boolean(),
    naturalLanguageQueries: z.boolean(),
  }),
});

export const developerSettingsSchema = z.object({
  debugMode: z.boolean(),
  logLevel: z.enum(['error', 'warning', 'info', 'debug']),
  apiRateLimits: z.object({
    perMinute: z.number().min(1),
    perHour: z.number().min(1),
  }),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

export function validateProfile(data: unknown) {
  return profileSchema.safeParse(data);
}

export function validatePasswordChange(data: unknown) {
  return passwordChangeSchema.safeParse(data);
}

export function validateUserForm(data: unknown) {
  return userFormSchema.safeParse(data);
}

export function validateUserPreferences(data: unknown) {
  return userPreferencesSchema.safeParse(data);
}

export function validateNotificationPreferences(data: unknown) {
  return notificationPreferencesSchema.safeParse(data);
}

export function validateCompanyInfo(data: unknown) {
  return companyInfoSchema.safeParse(data);
}

export function validateInventorySettings(data: unknown) {
  return inventorySettingsSchema.safeParse(data);
}

export function validateBackupConfig(data: unknown) {
  return backupConfigSchema.safeParse(data);
}

export function validateSystemLimits(data: unknown) {
  return systemLimitsSchema.safeParse(data);
}

export function validateGeminiConfig(data: unknown) {
  return geminiConfigSchema.safeParse(data);
}

export function validateDeveloperSettings(data: unknown) {
  return developerSettingsSchema.safeParse(data);
}

// ============================================================================
// Password Strength Validation
// ============================================================================

export interface PasswordStrengthResult {
  score: number; // 0-4
  feedback: string[];
  warning?: string;
}

export function calculatePasswordStrength(
  password: string
): PasswordStrengthResult {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
    feedback.push('Good: Mixed case letters');
  } else {
    feedback.push('Add both uppercase and lowercase letters');
  }

  if (/[0-9]/.test(password)) {
    feedback.push('Good: Contains numbers');
  } else {
    feedback.push('Add numbers');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
    feedback.push('Good: Contains special characters');
  } else {
    feedback.push('Add special characters');
  }

  // Common patterns check
  const commonPatterns = ['123', 'abc', 'password', 'qwerty', '111'];
  const lowerPassword = password.toLowerCase();
  for (const pattern of commonPatterns) {
    if (lowerPassword.includes(pattern)) {
      score = Math.max(0, score - 1);
      return {
        score: Math.min(4, score),
        feedback,
        warning: 'Avoid common patterns',
      };
    }
  }

  return {
    score: Math.min(4, score),
    feedback,
  };
}
