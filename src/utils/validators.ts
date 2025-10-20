import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// User Preferences Schema
const userPreferencesSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.enum(['en', 'ar']).optional(),
    notifications: z
      .object({
        email: z.boolean(),
        lowStock: z.boolean(),
        expiryAlerts: z.boolean(),
      })
      .optional(),
  })
  .optional();

// User Schema (for data integrity validation)
export const userSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .transform((email) => email.trim()),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .transform((name) => name.trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR'], {
    errorMap: () => ({ message: 'Invalid user role' }),
  }),
  isActive: z.boolean().default(true),
  preferences: userPreferencesSchema,
});

export type UserSchemaData = z.infer<typeof userSchema>;

// User Creation Schema (for forms)
export const userCreateSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  role: z.enum(['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR'], {
    errorMap: () => ({ message: 'Invalid user role' }),
  }),
});

export type UserCreateFormData = z.infer<typeof userCreateSchema>;

// Product Schema
export const productSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Product name is required')
      .min(2, 'Product name must be at least 2 characters')
      .max(200, 'Product name must not exceed 200 characters'),
    nameAr: z
      .string()
      .min(1, 'Arabic product name is required')
      .min(2, 'Arabic product name must be at least 2 characters')
      .max(200, 'Arabic product name must not exceed 200 characters'),
    sku: z
      .string()
      .min(1, 'SKU is required')
      .regex(
        /^[A-Z0-9-]+$/,
        'SKU must contain only uppercase letters, numbers, and hyphens'
      )
      .max(50, 'SKU must not exceed 50 characters'),
    category: z
      .string()
      .min(1, 'Category is required')
      .max(100, 'Category must not exceed 100 characters'),
    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .optional(),
    descriptionAr: z
      .string()
      .max(1000, 'Arabic description must not exceed 1000 characters')
      .optional(),
    unit: z
      .string()
      .min(1, 'Unit is required')
      .max(50, 'Unit must not exceed 50 characters'),
    minStockLevel: z
      .number()
      .int('Minimum stock level must be an integer')
      .min(0, 'Minimum stock level must be at least 0'),
    maxStockLevel: z
      .number()
      .int('Maximum stock level must be an integer')
      .min(1, 'Maximum stock level must be at least 1'),
    reorderPoint: z
      .number()
      .int('Reorder point must be an integer')
      .min(0, 'Reorder point must be at least 0'),
  })
  .refine((data) => data.maxStockLevel > data.minStockLevel, {
    message: 'Maximum stock level must be greater than minimum stock level',
    path: ['maxStockLevel'],
  })
  .refine(
    (data) =>
      data.reorderPoint >= data.minStockLevel &&
      data.reorderPoint <= data.maxStockLevel,
    {
      message: 'Reorder point must be between minimum and maximum stock levels',
      path: ['reorderPoint'],
    }
  );

export type ProductFormData = z.infer<typeof productSchema>;

// Inventory Item Schema (for data integrity validation - new simplified model)
export const inventoryItemSchema = z
  .object({
    itemName: z
      .string()
      .min(2, 'Item name must be at least 2 characters')
      .max(100, 'Item name must not exceed 100 characters')
      .transform((name) => name.trim()),
    batch: z
      .string()
      .regex(
        /^[A-Za-z0-9-]+$/,
        'Batch must contain only alphanumeric characters and hyphens'
      )
      .min(3, 'Batch must be at least 3 characters')
      .max(50, 'Batch must not exceed 50 characters')
      .transform((batch) => batch.trim()),
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .positive('Quantity must be positive')
      .max(1000000, 'Quantity must not exceed 1,000,000'),
    reject: z
      .number()
      .int('Reject must be an integer')
      .min(0, 'Reject must be non-negative')
      .default(0),
    destination: z.enum(['MAIS', 'FOZAN'], {
      errorMap: () => ({ message: 'Invalid destination' }),
    }),
    category: z
      .string()
      .max(100, 'Category must not exceed 100 characters')
      .optional(),
    notes: z
      .string()
      .max(5000, 'Notes must not exceed 5000 characters')
      .optional(),
  })
  .refine((data) => data.reject <= data.quantity, {
    message: 'Reject count cannot exceed quantity',
    path: ['reject'],
  });

export type InventoryItemSchemaData = z.infer<typeof inventoryItemSchema>;

// Legacy Inventory Item Schema (for old model - keeping for backward compatibility)
export const legacyInventoryItemSchema = z.object({
  productId: z
    .string()
    .min(1, 'Product is required')
    .cuid('Invalid product ID'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(0, 'Quantity must be at least 0'),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(200, 'Location must not exceed 200 characters'),
  batchNumber: z
    .string()
    .max(100, 'Batch number must not exceed 100 characters')
    .optional(),
  expiryDate: z
    .date({
      errorMap: () => ({ message: 'Invalid expiry date' }),
    })
    .optional()
    .refine(
      (date) => !date || date > new Date(),
      'Expiry date must be in the future'
    ),
  status: z.enum(['AVAILABLE', 'RESERVED', 'EXPIRED', 'DAMAGED'], {
    errorMap: () => ({ message: 'Invalid item status' }),
  }),
});

export type InventoryItemFormData = z.infer<typeof legacyInventoryItemSchema>;

// Transaction Schema
export const transactionSchema = z.object({
  inventoryItemId: z
    .string()
    .min(1, 'Inventory item is required')
    .cuid('Invalid inventory item ID'),
  type: z.enum(['RECEIVE', 'ISSUE', 'ADJUST', 'TRANSFER', 'DISPOSE'], {
    errorMap: () => ({ message: 'Invalid transaction type' }),
  }),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1'),
  reason: z
    .string()
    .max(500, 'Reason must not exceed 500 characters')
    .optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

// Registration Schema
export const registrationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .transform((email) => email.trim()),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .transform((name) => name.trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  role: z
    .enum(['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR'])
    .optional()
    .default('DATA_ENTRY'),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Password Change Schema
export const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// Batch Import Row Schema
export const batchImportRowSchema = z
  .object({
    itemName: z
      .string()
      .min(2, 'Item name must be at least 2 characters')
      .max(100, 'Item name must not exceed 100 characters'),
    batch: z
      .string()
      .regex(
        /^[A-Za-z0-9-]+$/,
        'Batch must contain only alphanumeric characters and hyphens'
      )
      .min(3, 'Batch must be at least 3 characters')
      .max(50, 'Batch must not exceed 50 characters'),
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .positive('Quantity must be positive')
      .max(1000000, 'Quantity must not exceed 1,000,000'),
    reject: z
      .number()
      .int('Reject must be an integer')
      .min(0, 'Reject must be non-negative')
      .optional()
      .default(0),
    destination: z.enum(['MAIS', 'FOZAN'], {
      errorMap: () => ({ message: 'Invalid destination' }),
    }),
    category: z
      .string()
      .max(100, 'Category must not exceed 100 characters')
      .optional(),
    notes: z
      .string()
      .max(5000, 'Notes must not exceed 5000 characters')
      .optional(),
  })
  .refine((data) => data.reject <= data.quantity, {
    message: 'Reject count cannot exceed quantity',
    path: ['reject'],
  });

export type BatchImportRowData = z.infer<typeof batchImportRowSchema>;

// Export Query Schema
export const exportQuerySchema = z.object({
  format: z.enum(['csv', 'excel', 'json'], {
    errorMap: () => ({ message: 'Invalid export format' }),
  }),
  search: z.string().optional(),
  destination: z.enum(['MAIS', 'FOZAN']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ExportQueryData = z.infer<typeof exportQuerySchema>;

// Report Generation Schema
export const reportGenerationSchema = z
  .object({
    type: z.enum(['MONTHLY', 'YEARLY', 'CUSTOM', 'AUDIT'], {
      errorMap: () => ({ message: 'Invalid report type' }),
    }),
    periodStart: z.string().datetime('Invalid start date'),
    periodEnd: z.string().datetime('Invalid end date'),
    includeCharts: z.boolean().optional().default(true),
    includeAiInsights: z.boolean().optional().default(false),
  })
  .refine((data) => new Date(data.periodEnd) > new Date(data.periodStart), {
    message: 'End date must be after start date',
    path: ['periodEnd'],
  });

export type ReportGenerationData = z.infer<typeof reportGenerationSchema>;

// Backup Creation Schema
export const backupCreationSchema = z.object({
  fileType: z.enum(['CSV', 'JSON', 'SQL'], {
    errorMap: () => ({ message: 'Invalid file type' }),
  }),
  includeAudit: z.boolean().optional().default(false),
});

export type BackupCreationData = z.infer<typeof backupCreationSchema>;

// Settings Update Schema
export const settingsUpdateSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1, 'Setting key is required'),
        value: z.any(),
      })
    )
    .min(1, 'At least one setting must be provided'),
});

export type SettingsUpdateData = z.infer<typeof settingsUpdateSchema>;

// Analytics Query Schema
export const analyticsQuerySchema = z.object({
  period: z
    .enum(['7d', '30d', '90d', '1y'], {
      errorMap: () => ({ message: 'Invalid period' }),
    })
    .optional()
    .default('30d'),
  groupBy: z
    .enum(['day', 'week', 'month'], {
      errorMap: () => ({ message: 'Invalid groupBy value' }),
    })
    .optional()
    .default('day'),
});

export type AnalyticsQueryData = z.infer<typeof analyticsQuerySchema>;

// AI Insights Request Schema
export const aiInsightsRequestSchema = z
  .object({
    dataType: z.enum(['inventory', 'trends', 'comparison'], {
      errorMap: () => ({ message: 'Invalid data type' }),
    }),
    period: z.object({
      startDate: z.string().datetime('Invalid start date'),
      endDate: z.string().datetime('Invalid end date'),
    }),
  })
  .refine(
    (data) => new Date(data.period.endDate) > new Date(data.period.startDate),
    {
      message: 'End date must be after start date',
      path: ['period', 'endDate'],
    }
  );

export type AiInsightsRequestData = z.infer<typeof aiInsightsRequestSchema>;

// Audit Log Query Schema
export const auditLogQuerySchema = z.object({
  userId: z.string().cuid().optional(),
  action: z
    .enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT'])
    .optional(),
  entityType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(200).optional().default(50),
});

export type AuditLogQueryData = z.infer<typeof auditLogQuerySchema>;

// Inventory Query Schema (enhanced)
export const inventoryQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(200).optional().default(50),
  search: z.string().optional(),
  destination: z.enum(['MAIS', 'FOZAN']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type InventoryQueryData = z.infer<typeof inventoryQuerySchema>;

// Inventory Update Schema (partial)
export const inventoryUpdateSchema = z.object({
  itemName: z
    .string()
    .min(2, 'Item name must be at least 2 characters')
    .max(100, 'Item name must not exceed 100 characters')
    .transform((name) => name.trim())
    .optional(),
  batch: z
    .string()
    .regex(
      /^[A-Za-z0-9-]+$/,
      'Batch must contain only alphanumeric characters and hyphens'
    )
    .min(3, 'Batch must be at least 3 characters')
    .max(50, 'Batch must not exceed 50 characters')
    .transform((batch) => batch.trim())
    .optional(),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(1000000, 'Quantity must not exceed 1,000,000')
    .optional(),
  reject: z
    .number()
    .int('Reject must be an integer')
    .min(0, 'Reject must be non-negative')
    .optional(),
  destination: z
    .enum(['MAIS', 'FOZAN'], {
      errorMap: () => ({ message: 'Invalid destination' }),
    })
    .optional(),
  category: z
    .string()
    .max(100, 'Category must not exceed 100 characters')
    .optional(),
  notes: z
    .string()
    .max(5000, 'Notes must not exceed 5000 characters')
    .optional(),
});

export type InventoryUpdateData = z.infer<typeof inventoryUpdateSchema>;
