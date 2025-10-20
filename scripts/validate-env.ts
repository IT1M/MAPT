import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { envSchema, type Env } from '../src/config/env';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  env?: Env;
}

/**
 * Validate environment variables using Zod schema
 */
function validateEnvironmentSchema(): {
  success: boolean;
  errors: string[];
  env?: Env;
} {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, errors: [], env };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.');
        return `❌ ${path}: ${err.message}`;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['❌ Unknown validation error'] };
  }
}

/**
 * Provide helpful hints for common configuration mistakes
 */
function getConfigurationHints(errors: string[]): string[] {
  const hints: string[] = [];

  if (errors.some((e) => e.includes('DATABASE_URL'))) {
    hints.push(
      '💡 DATABASE_URL should start with "postgresql://" or "postgres://"'
    );
    hints.push(
      '   Example: postgresql://user:password@localhost:5432/database'
    );
  }

  if (errors.some((e) => e.includes('NEXTAUTH_SECRET'))) {
    hints.push('💡 Generate NEXTAUTH_SECRET with: openssl rand -base64 32');
  }

  if (errors.some((e) => e.includes('NEXTAUTH_URL'))) {
    hints.push('💡 NEXTAUTH_URL should be your application URL');
    hints.push('   Development: http://localhost:3000');
    hints.push('   Production: https://yourdomain.com');
  }

  if (errors.some((e) => e.includes('GEMINI_API_KEY'))) {
    hints.push('💡 GEMINI_API_KEY must start with "AIzaSy"');
    hints.push(
      '   Get your API key from: https://makersuite.google.com/app/apikey'
    );
  }

  if (errors.some((e) => e.includes('NODE_ENV'))) {
    hints.push('💡 NODE_ENV must be one of: development, production, test');
  }

  return hints;
}

/**
 * Test database connectivity
 */
async function testDatabaseConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  console.log('\n🔗 Testing database connection...');

  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.log(`❌ Database connection failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify Gemini API key format and connectivity
 */
async function testGeminiAPI(
  apiKey: string
): Promise<{ success: boolean; error?: string; warning?: string }> {
  console.log('\n🤖 Testing Gemini API connection...');

  // First, verify the API key format
  if (!apiKey.startsWith('AIzaSy')) {
    console.log(
      '❌ Gemini API key format is invalid (should start with "AIzaSy")'
    );
    return {
      success: false,
      error: 'Invalid API key format - Gemini API keys start with "AIzaSy"',
    };
  }

  // Test API connectivity
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Simple test prompt
    const result = await model.generateContent('Hello');
    const response = result.response;

    if (response.text()) {
      console.log('✅ Gemini API connection successful');
      return { success: true };
    } else {
      console.log('⚠️  Gemini API responded but returned empty content');
      return {
        success: true,
        warning: 'Gemini API responded but returned empty content',
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (
      errorMessage.includes('API_KEY_INVALID') ||
      errorMessage.includes('invalid')
    ) {
      console.log('❌ Gemini API key is invalid');
      return { success: false, error: 'API key is invalid' };
    } else if (
      errorMessage.includes('quota') ||
      errorMessage.includes('rate')
    ) {
      console.log(
        '⚠️  Gemini API quota or rate limit issue (key may still be valid)'
      );
      return {
        success: true,
        warning: 'API quota or rate limit issue (key may still be valid)',
      };
    } else {
      console.log(`❌ Gemini API connection failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}

/**
 * Main validation function
 */
async function validateEnvironmentVariables(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Validating environment variables...\n');

  // Step 1: Validate environment schema
  const schemaValidation = validateEnvironmentSchema();

  if (!schemaValidation.success) {
    errors.push(...schemaValidation.errors);

    // Provide helpful hints
    const hints = getConfigurationHints(schemaValidation.errors);
    if (hints.length > 0) {
      console.log('\n📝 Configuration Hints:');
      hints.forEach((hint) => console.log(hint));
    }

    return {
      valid: false,
      errors,
      warnings,
    };
  }

  const env = schemaValidation.env!;
  console.log('✅ Environment schema validation passed\n');

  // Step 2: Test database connection
  const dbTest = await testDatabaseConnection();
  if (!dbTest.success) {
    errors.push(`❌ Database connection failed: ${dbTest.error}`);
    console.log('\n💡 Database Connection Hints:');
    console.log('   • Ensure PostgreSQL is running');
    console.log('   • Verify DATABASE_URL credentials are correct');
    console.log('   • Check if the database exists');
    console.log('   • Verify network connectivity to database server');
  }

  // Step 3: Test Gemini API
  const geminiTest = await testGeminiAPI(env.GEMINI_API_KEY);
  if (!geminiTest.success) {
    errors.push(`❌ Gemini API validation failed: ${geminiTest.error}`);
    console.log('\n💡 Gemini API Hints:');
    console.log(
      '   • Get your API key from: https://makersuite.google.com/app/apikey'
    );
    console.log('   • Ensure the API key starts with "AIzaSy"');
    console.log('   • Verify the API key has not been revoked');
  } else if (geminiTest.warning) {
    warnings.push(`⚠️  ${geminiTest.warning}`);
  }

  // Step 4: Check optional configurations
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    warnings.push(
      '⚠️  Email configuration is incomplete - email features will be disabled'
    );
    console.log('\n💡 Email Configuration (Optional):');
    console.log('   • Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM');
    console.log('   • Email is required for backup/report notifications');
  }

  if (!env.AUDIT_SIGNING_SECRET) {
    warnings.push(
      '⚠️  AUDIT_SIGNING_SECRET not set - audit logs will not be cryptographically signed'
    );
    console.log(
      '\n💡 Generate AUDIT_SIGNING_SECRET with: openssl rand -base64 32'
    );
  }

  if (!env.BACKUP_ENCRYPTION_KEY) {
    warnings.push(
      '⚠️  BACKUP_ENCRYPTION_KEY not set - backups will not be encrypted'
    );
    console.log(
      '\n💡 Generate BACKUP_ENCRYPTION_KEY with: openssl rand -base64 32'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    env,
  };
}

async function main() {
  console.log('🚀 Starting environment validation...\n');
  console.log('='.repeat(60));

  const result = await validateEnvironmentVariables();

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Validation Summary:\n');

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach((warning) => console.log(`   ${warning}`));
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach((error) => console.log(`   ${error}`));
    console.log('');
    console.log(
      '💡 Please fix the errors above before starting the application.'
    );
    process.exit(1);
  }

  console.log('✅ All environment variables are valid!');
  console.log('🎉 Application is ready to start.\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Unexpected error during validation:', error);
  process.exit(1);
});
