// Re-export Prisma types
export type { 
  User, 
  Session,
  Product, 
  InventoryItem, 
  Transaction, 
  AuditLog 
} from '@prisma/client'

export { 
  UserRole, 
  TransactionType,
  Destination,
  AuditAction
} from '@prisma/client'

// Permission type union
export type Permission = 
  | 'inventory:read'
  | 'inventory:write'
  | 'inventory:delete'
  | 'reports:view'
  | 'users:manage'
  | 'settings:manage'
  | 'audit:view'

// Extended types
import type { User, InventoryItem } from '@prisma/client'

export interface UserWithPermissions extends Omit<User, 'passwordHash'> {
  permissions: Permission[]
}

export interface InventoryItemWithUser extends InventoryItem {
  enteredBy: {
    id: string
    name: string
    email: string
  }
  rejectPercentage?: number
}

// Form data types
export interface LoginFormData {
  email: string
  password: string
}

export interface InventoryFormData {
  productId: string
  quantity: number
  location: string
  batchNumber?: string
  expiryDate?: Date
}

export interface ProductFormData {
  name: string
  nameAr: string
  sku: string
  category: string
  description?: string
  descriptionAr?: string
  unit: string
  minStockLevel: number
  maxStockLevel: number
  reorderPoint: number
}

export interface UserFormData {
  email: string
  name: string
  password?: string
  role: import('@prisma/client').UserRole
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  code: ErrorCode
  message: string
  details?: any
}

export interface ErrorResponse {
  success: false
  error: ApiError
}

export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
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
  | 'FILE_UPLOAD_ERROR'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Query parameter types
export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface InventoryQueryParams extends PaginationParams {
  location?: string
  productId?: string
  search?: string
  destination?: import('@prisma/client').Destination
}

export interface TransactionQueryParams extends PaginationParams {
  type?: import('@prisma/client').TransactionType
  inventoryItemId?: string
  startDate?: Date
  endDate?: Date
}

// Data Log specific types
export interface DataLogQueryParams extends PaginationParams {
  search?: string
  startDate?: string
  endDate?: string
  destination?: import('@prisma/client').Destination[]
  category?: string[]
  rejectFilter?: 'all' | 'none' | 'has' | 'high'
  enteredBy?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterState {
  search: string
  startDate: Date | null
  endDate: Date | null
  destinations: import('@prisma/client').Destination[]
  categories: string[]
  rejectFilter: 'all' | 'none' | 'has' | 'high'
  enteredByIds: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface FilterUser {
  id: string
  name: string
  email: string
}

export interface DataLogAggregates {
  totalQuantity: number
  totalRejects: number
  averageRejectRate: number
}

export interface DataLogResponse {
  items: InventoryItemWithUser[]
  pagination: PaginationMetadata
  aggregates: DataLogAggregates
}

// Audit history types
export interface FieldChange {
  field: string
  oldValue: any
  newValue: any
}

export interface AuditHistoryEntry {
  id: string
  timestamp: Date
  action: import('@prisma/client').AuditAction
  user: {
    id: string
    name: string
    email: string
    role: import('@prisma/client').UserRole
  }
  changes: FieldChange[]
  ipAddress: string | null
  userAgent: string | null
}

export interface AuditHistoryResponse {
  entries: AuditHistoryEntry[]
  pagination: PaginationMetadata
}
