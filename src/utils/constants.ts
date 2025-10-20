import { UserRole, ItemStatus, TransactionType } from '@prisma/client';

// User Roles
export const USER_ROLES = [
  UserRole.ADMIN,
  UserRole.DATA_ENTRY,
  UserRole.SUPERVISOR,
  UserRole.MANAGER,
  UserRole.AUDITOR,
] as const;

export const USER_ROLE_LABELS: Record<UserRole, { en: string; ar: string }> = {
  [UserRole.ADMIN]: { en: 'Administrator', ar: 'مدير النظام' },
  [UserRole.DATA_ENTRY]: { en: 'Data Entry', ar: 'إدخال البيانات' },
  [UserRole.SUPERVISOR]: { en: 'Supervisor', ar: 'مشرف' },
  [UserRole.MANAGER]: { en: 'Manager', ar: 'مدير' },
  [UserRole.AUDITOR]: { en: 'Auditor', ar: 'مدقق' },
};

// Item Status
export const ITEM_STATUS = [
  ItemStatus.AVAILABLE,
  ItemStatus.RESERVED,
  ItemStatus.EXPIRED,
  ItemStatus.DAMAGED,
] as const;

export const ITEM_STATUS_LABELS: Record<
  ItemStatus,
  { en: string; ar: string }
> = {
  [ItemStatus.AVAILABLE]: { en: 'Available', ar: 'متاح' },
  [ItemStatus.RESERVED]: { en: 'Reserved', ar: 'محجوز' },
  [ItemStatus.EXPIRED]: { en: 'Expired', ar: 'منتهي الصلاحية' },
  [ItemStatus.DAMAGED]: { en: 'Damaged', ar: 'تالف' },
};

// Transaction Types
export const TRANSACTION_TYPES = [
  TransactionType.RECEIVE,
  TransactionType.ISSUE,
  TransactionType.ADJUST,
  TransactionType.TRANSFER,
  TransactionType.DISPOSE,
] as const;

export const TRANSACTION_TYPE_LABELS: Record<
  TransactionType,
  { en: string; ar: string }
> = {
  [TransactionType.RECEIVE]: { en: 'Receive', ar: 'استلام' },
  [TransactionType.ISSUE]: { en: 'Issue', ar: 'صرف' },
  [TransactionType.ADJUST]: { en: 'Adjust', ar: 'تعديل' },
  [TransactionType.TRANSFER]: { en: 'Transfer', ar: 'نقل' },
  [TransactionType.DISPOSE]: { en: 'Dispose', ar: 'إتلاف' },
};

// Permissions
export type Permission =
  | 'inventory:read'
  | 'inventory:write'
  | 'inventory:delete'
  | 'reports:view'
  | 'users:manage'
  | 'settings:manage'
  | 'audit:view';

export const PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    'inventory:read',
    'inventory:write',
    'inventory:delete',
    'reports:view',
    'users:manage',
    'settings:manage',
    'audit:view',
  ],
  [UserRole.DATA_ENTRY]: ['inventory:read', 'inventory:write'],
  [UserRole.SUPERVISOR]: [
    'inventory:read',
    'inventory:write',
    'inventory:delete',
    'reports:view',
  ],
  [UserRole.MANAGER]: ['inventory:read', 'reports:view'],
  [UserRole.AUDITOR]: ['inventory:read', 'reports:view', 'audit:view'],
};

// Route Permissions
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': [
    UserRole.ADMIN,
    UserRole.DATA_ENTRY,
    UserRole.SUPERVISOR,
    UserRole.MANAGER,
    UserRole.AUDITOR,
  ],
  '/inventory': [UserRole.ADMIN, UserRole.DATA_ENTRY, UserRole.SUPERVISOR],
  '/reports': [
    UserRole.ADMIN,
    UserRole.SUPERVISOR,
    UserRole.MANAGER,
    UserRole.AUDITOR,
  ],
  '/settings': [UserRole.ADMIN],
  '/audit': [UserRole.ADMIN, UserRole.AUDITOR],
  '/users': [UserRole.ADMIN],
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// Date Formats
export const DATE_FORMAT = {
  SHORT: 'short',
  MEDIUM: 'medium',
  LONG: 'long',
  FULL: 'full',
} as const;

// API Response Codes
export const API_ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  AI_INSIGHTS: 300, // 5 minutes
  DASHBOARD_STATS: 60, // 1 minute
  INVENTORY_LIST: 30, // 30 seconds
} as const;

// Stock Level Thresholds
export const STOCK_THRESHOLDS = {
  CRITICAL: 0.1, // 10% of min stock level
  LOW: 0.25, // 25% of min stock level
  OPTIMAL: 0.75, // 75% of max stock level
} as const;

// Expiry Warning Thresholds (in days)
export const EXPIRY_WARNING_DAYS = {
  CRITICAL: 30, // 30 days
  WARNING: 90, // 90 days
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MINUTES: 15,
  API_REQUESTS_PER_MINUTE: 60,
  AI_REQUESTS_PER_HOUR: 100,
} as const;

// Session Configuration
export const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60, // 24 hours in seconds
  UPDATE_AGE: 60 * 60, // 1 hour in seconds
} as const;

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
} as const;

// Locales
export const LOCALES = ['en', 'ar'] as const;
export const DEFAULT_LOCALE = 'en' as const;

export type Locale = (typeof LOCALES)[number];
