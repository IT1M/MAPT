import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

async function validateEnvironmentVariables(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Validating environment variables...\n');

  // Check required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GEMINI_API_KEY',
    'NODE_ENV',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`❌ Missing required environment variable: ${varName}`);
    } else {
      console.log(`✅ ${varName} is set`);
    }
  }

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL.startsWith('postgresql://') && 
        !process.env.DATABASE_URL.startsWith('postgres://')) {
      errors.push('❌ DATABASE_URL must be a valid PostgreSQL connection string');
    }
  }

  // Validate NEXTAUTH_SECRET length
  if (process.env.NEXTAUTH_SECRET) {
    if (process.env.NEXTAUTH_SECRET.length < 32) {
      warnings.push('⚠️  NEXTAUTH_SECRET should be at least 32 characters for security');
    }
  }

  // Validate NEXTAUTH_URL format
  if (process.env.NEXTAUTH_URL) {
    try {
      new URL(process.env.NEXTAUTH_URL);
    } catch {
      errors.push('❌ NEXTAUTH_URL must be a valid URL');
    }
  }

  // Validate NODE_ENV value
  if (process.env.NODE_ENV) {
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(process.env.NODE_ENV)) {
      warnings.push(`⚠️  NODE_ENV should be one of: ${validEnvs.join(', ')}`);
    }
  }

  console.log('\n🔗 Testing database connection...');
  
  // Test database connection
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
  } catch (error) {
    errors.push(`❌ Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n🤖 Testing Gemini API connection...');
  
  // Test Gemini API key
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Simple test prompt
      const result = await model.generateContent('Hello');
      const response = await result.response;
      
      if (response.text()) {
        console.log('✅ Gemini API connection successful');
      } else {
        warnings.push('⚠️  Gemini API responded but returned empty content');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid')) {
        errors.push('❌ Gemini API key is invalid');
      } else if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
        warnings.push('⚠️  Gemini API quota or rate limit issue (key may still be valid)');
      } else {
        errors.push(`❌ Gemini API connection failed: ${errorMessage}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function main() {
  console.log('🚀 Starting environment validation...\n');
  console.log('=' .repeat(60));
  
  const result = await validateEnvironmentVariables();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Validation Summary:\n');
  
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }
  
  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach(error => console.log(`   ${error}`));
    console.log('');
    console.log('💡 Please fix the errors above before starting the application.');
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
