/**
 * Database Connection Verification Script
 *
 * This script tests the database connection and provides helpful
 * information about the database setup.
 */

import { testConnection } from '../src/services/prisma';

async function main() {
  console.log('🔍 Verifying database connection...\n');

  const isConnected = await testConnection();

  if (isConnected) {
    console.log('\n✅ Database is ready!');
    console.log('You can now run: npm run db:migrate');
  } else {
    console.log('\n❌ Database connection failed!');
    console.log('\nPlease ensure:');
    console.log('1. PostgreSQL is running');
    console.log('2. DATABASE_URL in .env is correct');
    console.log('3. Database exists and user has proper permissions');
    console.log('\nExample DATABASE_URL format:');
    console.log('postgresql://username:password@localhost:5432/database_name');
  }

  process.exit(isConnected ? 0 : 1);
}

main();
