import { z } from 'zod';

/**
 * Environment Variable Schema
 *
 * This schema defines and validates all environment variables used in the application.
 * It ensures type safety and provides clear error messages for misconfiguration.
 */

const envSchema = z.object({
  // ============================================
  // Database Configuration
  // ============================================
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection string'
    ),

  // Optional: Direct database URL without connection pooling
  // Used for migrations and administrative tasks
  DATABASE_URL_DIRECT: z
    .string()
    .url()
    .optional()
    .refine(
      (url) =>
        !url ||
        url.startsWith('postgresql://') ||
        url.startsWith('postgres://'),
      'DATABASE_URL_DIRECT must be a valid PostgreSQL connection string'
    ),

  // Database connection pool settings
  DATABASE_POOL_MIN: z
    .string()
    .optional()
    .default('2')
    .transform((val) => parseInt(val, 10)),

  DATABASE_POOL_MAX: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10)),

  DATABASE_POOL_TIMEOUT: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10)),

  // ============================================
  // Authentication Configuration
  // ============================================
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security'),

  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // ============================================
  // AI Integration Configuration
  // ============================================
  GEMINI_API_KEY: z
    .string()
    .refine(
      (key) => key.startsWith('AIzaSy'),
      'GEMINI_API_KEY must be a valid Gemini API key (starts with "AIzaSy")'
    ),

  GEMINI_MODEL: z.string().default('gemini-1.5-pro'),

  // ============================================
  // Application Configuration
  // ============================================
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .optional()
    .default('http://localhost:3000'),

  // ============================================
  // Feature Flags
  // ============================================
  NEXT_PUBLIC_ENABLE_AI_INSIGHTS: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  NEXT_PUBLIC_ENABLE_AUTO_BACKUP: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  ENABLE_AUDIT_SYSTEM: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  ENABLE_BACKUP_SYSTEM: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  ENABLE_REPORT_SYSTEM: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  // ============================================
  // Email Configuration (Optional)
  // ============================================
  SMTP_HOST: z.string().optional(),

  SMTP_PORT: z
    .string()
    .optional()
    .default('587')
    .transform((val) => parseInt(val, 10)),

  SMTP_SECURE: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),

  SMTP_USER: z.string().optional(),

  SMTP_PASSWORD: z.string().optional(),

  SMTP_FROM: z.string().email().optional(),

  SMTP_FROM_NAME: z.string().optional().default('Saudi Mais Inventory System'),

  ADMIN_EMAIL: z.string().email().optional(),

  // ============================================
  // Storage Configuration
  // ============================================
  BACKUP_STORAGE_PATH: z.string().default('./backups'),

  REPORT_STORAGE_PATH: z.string().default('./public/reports'),

  BACKUP_MAX_STORAGE_GB: z
    .string()
    .optional()
    .default('100')
    .transform((val) => parseInt(val, 10)),

  // ============================================
  // Security Configuration
  // ============================================
  AUDIT_SIGNING_SECRET: z.string().optional(),

  BACKUP_ENCRYPTION_KEY: z.string().optional(),

  RATE_LIMIT_PER_MINUTE: z
    .string()
    .optional()
    .default('60')
    .transform((val) => parseInt(val, 10)),

  SESSION_TIMEOUT: z
    .string()
    .optional()
    .default('30')
    .transform((val) => parseInt(val, 10)),

  MAX_LOGIN_ATTEMPTS: z
    .string()
    .optional()
    .default('5')
    .transform((val) => parseInt(val, 10)),

  // ============================================
  // Logging Configuration
  // ============================================
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .optional()
    .default('info'),

  DEBUG_MODE: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),

  // ============================================
  // Cron/Scheduling Configuration
  // ============================================
  CRON_TIMEZONE: z.string().optional().default('Asia/Riyadh'),

  // ============================================
  // Optional: Redis Configuration
  // ============================================
  AUDIT_QUEUE_REDIS_URL: z.string().url().optional(),
});

/**
 * Parsed and validated environment variables
 *
 * This object contains all environment variables with proper types.
 * Access environment variables through this object instead of process.env
 * to ensure type safety and validation.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 *
 * @returns Parsed environment variables with proper types
 * @throws ZodError if validation fails
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:\n');

      error.errors.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  • ${path}: ${err.message}`);
      });

      console.error('\n💡 Please check your .env file against .env.example');
      console.error('💡 Run "npm run validate:env" for detailed validation\n');

      throw new Error('Environment validation failed');
    }
    throw error;
  }
}

/**
 * Get validated environment variables
 *
 * This is a cached version that only validates once.
 * Use this in your application code.
 */
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Check if email configuration is complete
 */
export function isEmailConfigured(env: Env): boolean {
  return !!(
    env.SMTP_HOST &&
    env.SMTP_USER &&
    env.SMTP_PASSWORD &&
    env.SMTP_FROM
  );
}

/**
 * Check if Redis is configured for audit queue
 */
export function isRedisConfigured(env: Env): boolean {
  return !!env.AUDIT_QUEUE_REDIS_URL;
}

// Export the schema for testing purposes
export { envSchema };
