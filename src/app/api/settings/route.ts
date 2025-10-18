import { NextRequest } from 'next/server'
import { prisma } from '@/services/prisma'
import { checkAuth, checkRole } from '@/middleware/auth'
import {
  successResponse,
  handleApiError,
  validationError,
} from '@/utils/api-response'
import { settingsUpdateSchema } from '@/utils/validators'
import { createAuditLog, extractRequestMetadata } from '@/utils/audit'

/**
 * Sensitive setting keys that should only be visible to ADMIN users
 */
const SENSITIVE_KEYS = [
  'gemini_api_key',
  'database_url',
  'nextauth_secret',
  'email_server_password',
  'smtp_password',
  'api_secret_key',
]

/**
 * Allowed setting keys with their data types and validation
 */
const ALLOWED_SETTINGS: Record<string, {
  type: 'string' | 'number' | 'boolean' | 'json'
  validate?: (value: any) => boolean
}> = {
  // General settings
  'app_name': { type: 'string' },
  'app_timezone': { type: 'string' },
  'date_format': { type: 'string' },
  'time_format': { type: 'string' },
  
  // Company settings
  'company_name': { type: 'string' },
  'company_logo': { type: 'string' },
  'fiscal_year_start': { type: 'number', validate: (v) => v >= 1 && v <= 12 },
  'timezone': { type: 'string' },
  
  // Inventory settings
  'soft_delete_enabled': { type: 'boolean' },
  'default_destination': { type: 'string', validate: (v) => !v || ['MAIS', 'FOZAN'].includes(v) },
  'max_batch_import_size': { type: 'number', validate: (v) => v > 0 && v <= 10000 },
  'low_stock_threshold': { type: 'number', validate: (v) => v >= 0 },
  'categories_enabled': { type: 'boolean' },
  'predefined_categories': { type: 'json' },
  'auto_batch_numbers': { type: 'boolean' },
  'batch_number_pattern': { type: 'string' },
  'supervisor_approval': { type: 'boolean' },
  'approval_threshold': { type: 'number', validate: (v) => v >= 0 },
  
  // Report settings
  'report_retention_days': { type: 'number', validate: (v) => v > 0 },
  'enable_ai_insights': { type: 'boolean' },
  'default_report_format': { type: 'string', validate: (v) => ['PDF', 'EXCEL', 'CSV'].includes(v) },
  
  // Backup settings
  'backup_enabled': { type: 'boolean' },
  'backup_time': { type: 'string' },
  'backup_retention_days': { type: 'number', validate: (v) => v > 0 && v <= 365 },
  'backup_format': { type: 'json' },
  'auto_backup_enabled': { type: 'boolean' },
  'backup_schedule': { type: 'string' },
  'last_backup_timestamp': { type: 'string' },
  'last_backup_status': { type: 'string' },
  
  // Security settings
  'session_timeout_minutes': { type: 'number', validate: (v) => v >= 5 && v <= 1440 },
  'max_login_attempts': { type: 'number', validate: (v) => v >= 1 && v <= 10 },
  'password_expiry_days': { type: 'number', validate: (v) => v >= 0 },
  'require_2fa': { type: 'boolean' },
  'max_items_per_user_per_day': { type: 'number', validate: (v) => v >= 1 && v <= 10000 },
  'max_file_upload_size_mb': { type: 'number', validate: (v) => v >= 1 && v <= 100 },
  
  // Notification settings
  'email_notifications_enabled': { type: 'boolean' },
  'low_stock_alerts': { type: 'boolean' },
  'expiry_alerts_days': { type: 'number', validate: (v) => v >= 0 },
  
  // API settings
  'rate_limit_per_minute': { type: 'number', validate: (v) => v >= 10 && v <= 1000 },
  'gemini_cache_ttl_minutes': { type: 'number', validate: (v) => v >= 0 },
  'analytics_cache_ttl_minutes': { type: 'number', validate: (v) => v >= 0 },
  'debug_mode': { type: 'boolean' },
  'log_level': { type: 'string', validate: (v) => ['error', 'warning', 'info', 'debug'].includes(v) },
  'api_rate_limit_per_minute': { type: 'number', validate: (v) => v >= 1 },
  'api_rate_limit_per_hour': { type: 'number', validate: (v) => v >= 1 },
}

/**
 * GET /api/settings
 * 
 * Fetch all system settings from database
 * 
 * Requirements: 9.1
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Fetch all system settings from database
    const allSettings = await prisma.systemSettings.findMany({
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    })

    // Filter sensitive keys for non-admin users
    const isAdmin = context.user.role === 'ADMIN'
    const filteredSettings = allSettings.filter((setting) => {
      if (!isAdmin && SENSITIVE_KEYS.includes(setting.key)) {
        return false
      }
      return true
    })

    // Group settings by category
    const settingsByCategory: Record<string, any[]> = {}
    const categories: string[] = []

    filteredSettings.forEach((setting) => {
      if (!settingsByCategory[setting.category]) {
        settingsByCategory[setting.category] = []
        categories.push(setting.category)
      }

      settingsByCategory[setting.category].push({
        key: setting.key,
        value: setting.value,
        category: setting.category,
        updatedAt: setting.updatedAt.toISOString(),
        updatedBy: setting.updatedBy,
      })
    })

    // Return settings object with categories array
    return successResponse({
      settings: settingsByCategory,
      categories: categories.sort(),
      total: filteredSettings.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/settings
 * 
 * Update system settings
 * 
 * Request Body:
 * - settings: Array<{ key: string, value: any }>
 * 
 * Requirements: 9.2, 9.3, 9.4
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check user role (ADMIN only)
    const roleCheck = checkRole('ADMIN', context)
    if ('error' in roleCheck) {
      return roleCheck.error
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = settingsUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return validationError('Invalid request body', validationResult.error.errors)
    }

    const { settings } = validationResult.data

    // Validate each key against allowed keys
    const invalidKeys: string[] = []
    const validationErrors: Array<{ key: string; message: string }> = []

    for (const setting of settings) {
      // Check if key is allowed
      if (!ALLOWED_SETTINGS[setting.key]) {
        invalidKeys.push(setting.key)
        continue
      }

      const allowedSetting = ALLOWED_SETTINGS[setting.key]

      // Validate values against defined data types
      const valueType = typeof setting.value
      let isValidType = false

      switch (allowedSetting.type) {
        case 'string':
          isValidType = valueType === 'string'
          break
        case 'number':
          isValidType = valueType === 'number' && !isNaN(setting.value)
          break
        case 'boolean':
          isValidType = valueType === 'boolean'
          break
        case 'json':
          isValidType = true // Any valid JSON
          break
      }

      if (!isValidType) {
        validationErrors.push({
          key: setting.key,
          message: `Expected type ${allowedSetting.type}, got ${valueType}`,
        })
        continue
      }

      // Run custom validation if provided
      if (allowedSetting.validate && !allowedSetting.validate(setting.value)) {
        validationErrors.push({
          key: setting.key,
          message: `Value validation failed for ${setting.key}`,
        })
      }
    }

    // Return validation errors if any
    if (invalidKeys.length > 0 || validationErrors.length > 0) {
      return validationError('Settings validation failed', {
        invalidKeys: invalidKeys.length > 0 ? invalidKeys : undefined,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      })
    }

    // Update settings in Prisma transaction
    const updatedSettings = await prisma.$transaction(async (tx) => {
      const results = []

      for (const setting of settings) {
        // Fetch existing setting to capture old value
        const existingSetting = await tx.systemSettings.findUnique({
          where: { key: setting.key },
        })

        // Determine category based on key prefix or default to 'general'
        let category = 'general'
        if (setting.key.startsWith('app_')) category = 'general'
        else if (setting.key.includes('backup')) category = 'backup'
        else if (setting.key.includes('report')) category = 'reports'
        else if (setting.key.includes('stock') || setting.key.includes('batch') || setting.key.includes('destination')) category = 'inventory'
        else if (setting.key.includes('session') || setting.key.includes('login') || setting.key.includes('password') || setting.key.includes('2fa')) category = 'security'
        else if (setting.key.includes('notification') || setting.key.includes('alert')) category = 'notifications'
        else if (setting.key.includes('rate_limit') || setting.key.includes('cache') || setting.key.includes('gemini')) category = 'api'

        // Upsert setting
        const updated = await tx.systemSettings.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            updatedById: context.user.id,
          },
          create: {
            key: setting.key,
            value: setting.value,
            category,
            updatedById: context.user.id,
          },
          include: {
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        results.push(updated)

        // Create audit log for each changed setting
        const metadata = extractRequestMetadata(request)
        await createAuditLog({
          userId: context.user.id,
          action: 'UPDATE',
          entity: 'SystemSettings',
          entityId: updated.id,
          changes: {
            oldValue: existingSetting ? existingSetting.value : null,
            newValue: setting.value,
          },
          metadata,
        })
      }

      return results
    })

    // Return updated settings
    const formattedSettings = updatedSettings.map((setting) => ({
      key: setting.key,
      value: setting.value,
      category: setting.category,
      updatedAt: setting.updatedAt.toISOString(),
      updatedBy: setting.updatedBy,
    }))

    return successResponse(
      {
        settings: formattedSettings,
        updated: formattedSettings.length,
      },
      'Settings updated successfully'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
