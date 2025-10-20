// Re-export Prisma types with proper naming
export type {
  users as User,
  sessions as Session,
  products as Product,
  inventory_items as InventoryItem,
  transactions as Transaction,
  audit_logs as AuditLog,
} from '@prisma/client';

export {
  UserRole,
  TransactionType,
  Destination,
  ActionType,
  EntityType,
} from '@prisma/client';

// Permission type union
export type Permission =
  | 'inventory:read'
  | 'inventory:write'
  | 'inventory:delete'
  | 'reports:view'
  | 'users:manage'
  | 'settings:manage'
  | 'audit:view';

// Extended types
import type { users as User, inventory_items as InventoryItem } from '@prisma/client';

export interface UserWithPermissions extends Omit<User, 'passwordHash'> {
  permissions: Permission[];
}

export interface InventoryItemWithUser extends InventoryItem {
  enteredBy: {
    id: string;
    name: string;
    email: string;
  };
  rejectPercentage?: number;
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface InventoryFormData {
  productId: string;
  quantity: number;
  location: string;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface ProductFormData {
  name: string;
  nameAr: string;
  sku: string;
  category: string;
  description?: string;
  descriptionAr?: string;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
}

export interface UserFormData {
  email: string;
  name: string;
  password?: string;
  role: import('@prisma/client').UserRole;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: ApiError;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

// Error codes
export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR'
  | 'INVALID_INPUT'
  | 'FILE_UPLOAD_ERROR';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Query parameter types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface InventoryQueryParams extends PaginationParams {
  location?: string;
  productId?: string;
  search?: string;
  destination?: import('@prisma/client').Destination;
}

export interface TransactionQueryParams extends PaginationParams {
  type?: import('@prisma/client').TransactionType;
  inventoryItemId?: string;
  startDate?: Date;
  endDate?: Date;
}

// Data Log specific types
export interface DataLogQueryParams extends PaginationParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  destination?: import('@prisma/client').Destination[];
  category?: string[];
  rejectFilter?: 'all' | 'none' | 'has' | 'high';
  enteredBy?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterState {
  search: string;
  startDate: Date | null;
  endDate: Date | null;
  destinations: import('@prisma/client').Destination[];
  categories: string[];
  rejectFilter: 'all' | 'none' | 'has' | 'high';
  enteredByIds: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterUser {
  id: string;
  name: string;
  email: string;
}

export interface DataLogAggregates {
  totalQuantity: number;
  totalRejects: number;
  averageRejectRate: number;
}

export interface DataLogResponse {
  items: InventoryItemWithUser[];
  pagination: PaginationMetadata;
  aggregates: DataLogAggregates;
}

// Audit history types
export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditHistoryEntry {
  id: string;
  timestamp: Date;
  action: import('@prisma/client').ActionType;
  user: {
    id: string;
    name: string;
    email: string;
    role: import('@prisma/client').UserRole;
  };
  changes: FieldChange[];
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditHistoryResponse {
  entries: AuditHistoryEntry[];
  pagination: PaginationMetadata;
}

// Additional Form Types
export interface RegisterFormData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
  token: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DataEntryFormData {
  itemName: string;
  batch: string;
  quantity: number;
  reject: number;
  destination: import('@prisma/client').Destination;
  category: string;
  notes?: string;
}

// Filter Types
export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: Partial<FilterState>;
}

// Analytics Types
export interface AnalyticsMetrics {
  totalItems: number;
  totalQuantity: number;
  totalRejects: number;
  averageRejectRate: number;
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  topDestinations: Array<{
    destination: import('@prisma/client').Destination;
    count: number;
    percentage: number;
  }>;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TrendData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

// Report Types
export interface ReportConfig {
  title: string;
  description?: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: Partial<FilterState>;
  includeCharts: boolean;
  format: 'pdf' | 'excel' | 'csv';
}

export interface GeneratedReport {
  id: string;
  title: string;
  generatedAt: Date;
  generatedBy: string;
  fileUrl: string;
  format: string;
  size: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// Settings Types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  locale: 'en' | 'ar';
  notifications: {
    email: boolean;
    push: boolean;
    dailySummary: boolean;
  };
  display: {
    compactMode: boolean;
    showRejectPercentage: boolean;
    defaultPageSize: number;
  };
}

export interface SystemSettings {
  key: string;
  value: string;
  category: string;
  description?: string;
  updatedAt: Date;
  updatedBy: string;
}

// Backup Types
export interface BackupMetadata {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  createdBy: string;
  status: 'pending' | 'completed' | 'failed';
  type: 'manual' | 'automatic';
  recordCount?: number;
}

export interface RestoreOptions {
  backupId: string;
  confirmOverwrite: boolean;
  notifyUsers: boolean;
}

// Search Types
export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  query: string;
  took: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

export interface SearchQuery {
  q: string;
  filters?: Record<string, string | string[]>;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  includeHeaders: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Partial<FilterState>;
  columns?: string[];
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Session Types
export interface SessionData {
  user: UserWithPermissions;
  expiresAt: Date;
  lastActivity: Date;
}

// Dashboard Types
export interface DashboardStats {
  todayEntries: number;
  weekEntries: number;
  monthEntries: number;
  totalQuantity: number;
  averageRejectRate: number;
  topCategory: string;
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: Date;
    user: string;
  }>;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  color: string;
  permission?: Permission;
}

// Type Guards
export function isApiError(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  );
}

export function isSuccessResponse<T>(
  response: unknown
): response is SuccessResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === true &&
    'data' in response
  );
}
