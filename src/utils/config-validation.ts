/**
 * Configuration Validation Utility
 * Validates required environment variables for audit, backup, and report systems
 */

interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate audit system configuration
 */
export function validateAuditConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check audit signing secret
  if (!process.env.AUDIT_SIGNING_SECRET) {
    errors.push('AUDIT_SIGNING_SECRET is required for tamper-proof audit logs');
  } else if (process.env.AUDIT_SIGNING_SECRET.length < 32) {
    warnings.push(
      'AUDIT_SIGNING_SECRET should be at least 32 characters for security'
    );
  }

  // Check optional queue configuration
  if (!process.env.AUDIT_QUEUE_REDIS_URL) {
    warnings.push(
      'AUDIT_QUEUE_REDIS_URL not set - audit logging will be synchronous'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate backup system configuration
 */
export function validateBackupConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check backup storage path
  if (!process.env.BACKUP_STORAGE_PATH) {
    errors.push('BACKUP_STORAGE_PATH is required for backup system');
  }

  // Check backup encryption key
  if (!process.env.BACKUP_ENCRYPTION_KEY) {
    warnings.push(
      'BACKUP_ENCRYPTION_KEY not set - encrypted backups will not be available'
    );
  } else if (process.env.BACKUP_ENCRYPTION_KEY.length < 32) {
    warnings.push(
      'BACKUP_ENCRYPTION_KEY should be at least 32 characters for security'
    );
  }

  // Check max storage
  if (!process.env.BACKUP_MAX_STORAGE_GB) {
    warnings.push('BACKUP_MAX_STORAGE_GB not set - using default of 100GB');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate report system configuration
 */
export function validateReportConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check report storage path
  if (!process.env.REPORT_STORAGE_PATH) {
    errors.push('REPORT_STORAGE_PATH is required for report system');
  }

  // Check Gemini API key (for AI insights)
  if (!process.env.GEMINI_API_KEY) {
    warnings.push(
      'GEMINI_API_KEY not set - AI insights will not be available in reports'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate email/SMTP configuration
 */
export function validateEmailConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check SMTP configuration
  if (!process.env.SMTP_HOST) {
    warnings.push(
      'SMTP_HOST not set - email notifications will not be available'
    );
  }

  if (!process.env.SMTP_PORT) {
    warnings.push('SMTP_PORT not set - using default port 587');
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    warnings.push(
      'SMTP credentials not set - email notifications will not work'
    );
  }

  if (!process.env.SMTP_FROM) {
    warnings.push('SMTP_FROM not set - using default sender address');
  }

  if (!process.env.ADMIN_EMAIL) {
    warnings.push(
      'ADMIN_EMAIL not set - system notifications will not be sent'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate cron/scheduling configuration
 */
export function validateCronConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check timezone
  if (!process.env.CRON_TIMEZONE) {
    warnings.push('CRON_TIMEZONE not set - using default timezone Asia/Riyadh');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all audit/backup/report configurations
 */
export function validateAllConfigs(): {
  valid: boolean;
  results: {
    audit: ConfigValidationResult;
    backup: ConfigValidationResult;
    report: ConfigValidationResult;
    email: ConfigValidationResult;
    cron: ConfigValidationResult;
  };
} {
  const results = {
    audit: validateAuditConfig(),
    backup: validateBackupConfig(),
    report: validateReportConfig(),
    email: validateEmailConfig(),
    cron: validateCronConfig(),
  };

  const valid = Object.values(results).every((result) => result.valid);

  return {
    valid,
    results,
  };
}

/**
 * Print validation results to console
 */
export function printValidationResults(
  results: ReturnType<typeof validateAllConfigs>
): void {
  console.log('\n=== Configuration Validation ===\n');

  const sections = [
    { name: 'Audit System', result: results.results.audit },
    { name: 'Backup System', result: results.results.backup },
    { name: 'Report System', result: results.results.report },
    { name: 'Email/SMTP', result: results.results.email },
    { name: 'Cron/Scheduling', result: results.results.cron },
  ];

  for (const section of sections) {
    console.log(`\n${section.name}:`);

    if (section.result.errors.length > 0) {
      console.log('  ❌ Errors:');
      section.result.errors.forEach((error) => console.log(`     - ${error}`));
    }

    if (section.result.warnings.length > 0) {
      console.log('  ⚠️  Warnings:');
      section.result.warnings.forEach((warning) =>
        console.log(`     - ${warning}`)
      );
    }

    if (
      section.result.errors.length === 0 &&
      section.result.warnings.length === 0
    ) {
      console.log('  ✅ Configuration valid');
    }
  }

  console.log('\n================================\n');

  if (!results.valid) {
    console.log(
      '❌ Configuration validation failed. Please fix the errors above.\n'
    );
  } else {
    console.log('✅ All configurations are valid!\n');
  }
}

/**
 * Get configuration value with fallback
 */
export function getConfig(key: string, fallback?: string): string {
  return process.env[key] || fallback || '';
}

/**
 * Get configuration as number
 */
export function getConfigNumber(key: string, fallback: number): number {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Get configuration as boolean
 */
export function getConfigBoolean(key: string, fallback: boolean): boolean {
  const value = process.env[key];
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
}

/**
 * Configuration constants with defaults
 */
export const CONFIG = {
  // Audit
  AUDIT_SIGNING_SECRET: getConfig('AUDIT_SIGNING_SECRET'),
  AUDIT_QUEUE_REDIS_URL: getConfig('AUDIT_QUEUE_REDIS_URL'),

  // Backup
  BACKUP_STORAGE_PATH: getConfig(
    'BACKUP_STORAGE_PATH',
    '/var/backups/mais-inventory'
  ),
  BACKUP_ENCRYPTION_KEY: getConfig('BACKUP_ENCRYPTION_KEY'),
  BACKUP_MAX_STORAGE_GB: getConfigNumber('BACKUP_MAX_STORAGE_GB', 100),

  // Report
  REPORT_STORAGE_PATH: getConfig(
    'REPORT_STORAGE_PATH',
    '/var/reports/mais-inventory'
  ),

  // Email
  SMTP_HOST: getConfig('SMTP_HOST'),
  SMTP_PORT: getConfigNumber('SMTP_PORT', 587),
  SMTP_SECURE: getConfigBoolean('SMTP_SECURE', false),
  SMTP_USER: getConfig('SMTP_USER'),
  SMTP_PASSWORD: getConfig('SMTP_PASSWORD'),
  SMTP_FROM: getConfig('SMTP_FROM', 'noreply@mais-inventory.com'),
  SMTP_FROM_NAME: getConfig('SMTP_FROM_NAME', 'Saudi Mais Inventory System'),
  ADMIN_EMAIL: getConfig('ADMIN_EMAIL'),

  // Cron
  CRON_TIMEZONE: getConfig('CRON_TIMEZONE', 'Asia/Riyadh'),

  // Security
  RATE_LIMIT_PER_MINUTE: getConfigNumber('RATE_LIMIT_PER_MINUTE', 60),
  SESSION_TIMEOUT: getConfigNumber('SESSION_TIMEOUT', 30),
  MAX_LOGIN_ATTEMPTS: getConfigNumber('MAX_LOGIN_ATTEMPTS', 5),

  // Feature Flags
  ENABLE_AUDIT_SYSTEM: getConfigBoolean('ENABLE_AUDIT_SYSTEM', true),
  ENABLE_BACKUP_SYSTEM: getConfigBoolean('ENABLE_BACKUP_SYSTEM', true),
  ENABLE_REPORT_SYSTEM: getConfigBoolean('ENABLE_REPORT_SYSTEM', true),
  ENABLE_AI_INSIGHTS: getConfigBoolean('ENABLE_AI_INSIGHTS', true),

  // Debug
  DEBUG_MODE: getConfigBoolean('DEBUG_MODE', false),
  LOG_LEVEL: getConfig('LOG_LEVEL', 'info'),
} as const;

export default CONFIG;
