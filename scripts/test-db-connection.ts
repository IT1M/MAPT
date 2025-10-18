#!/usr/bin/env tsx

/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and verifies that the application
 * can successfully connect to and query the database.
 * 
 * Usage:
 *   npm run test:db
 *   or
 *   DATABASE_URL="your-connection-string" npx tsx scripts/test-db-connection.ts
 */

import { PrismaClient } from '@prisma/client';

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({
      name,
      status: 'pass',
      message: 'Success',
      duration
    });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      name,
      status: 'fail',
      message,
      duration
    });
    console.error(`❌ ${name} (${duration}ms)`);
    console.error(`   Error: ${message}`);
  }
}

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection\n');
  console.log('━'.repeat(60));
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('   Please set DATABASE_URL before running this script\n');
    process.exit(1);
  }

  // Mask password in URL for display
  const maskedUrl = process.env.DATABASE_URL.replace(
    /:[^:@]+@/,
    ':****@'
  );
  console.log(`📊 Database URL: ${maskedUrl}\n`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['error']
  });

  try {
    // Test 1: Basic Connection
    await runTest('Basic Connection', async () => {
      await prisma.$connect();
    });

    // Test 2: Query Execution
    await runTest('Query Execution', async () => {
      await prisma.$queryRaw`SELECT 1 as test`;
    });

    // Test 3: PostgreSQL Version
    await runTest('PostgreSQL Version Check', async () => {
      const result = await prisma.$queryRaw<Array<{ version: string }>>`
        SELECT version()
      `;
      if (result && result[0]) {
        console.log(`   Version: ${result[0].version.split(',')[0]}`);
      }
    });

    // Test 4: Database Name
    await runTest('Database Name Check', async () => {
      const result = await prisma.$queryRaw<Array<{ current_database: string }>>`
        SELECT current_database()
      `;
      if (result && result[0]) {
        console.log(`   Database: ${result[0].current_database}`);
      }
    });

    // Test 5: Schema Check
    await runTest('Schema Existence Check', async () => {
      const result = await prisma.$queryRaw<Array<{ schema_name: string }>>`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = 'public'
      `;
      if (!result || result.length === 0) {
        throw new Error('Public schema not found');
      }
    });

    // Test 6: Table Count
    await runTest('Table Count', async () => {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `;
      if (result && result[0]) {
        console.log(`   Tables: ${result[0].count}`);
      }
    });

    // Test 7: User Table Access
    await runTest('User Table Access', async () => {
      const count = await prisma.user.count();
      console.log(`   User records: ${count}`);
    });

    // Test 8: Write Permission Test
    await runTest('Write Permission Test', async () => {
      // Try to create a test record (will rollback)
      await prisma.$transaction(async (tx) => {
        const testUser = await tx.user.create({
          data: {
            email: `test-${Date.now()}@example.com`,
            name: 'Test User',
            passwordHash: 'test',
            role: 'DATA_ENTRY'
          }
        });
        
        // Verify it was created
        const found = await tx.user.findUnique({
          where: { id: testUser.id }
        });
        
        if (!found) {
          throw new Error('Failed to create test record');
        }
        
        // Rollback by throwing an error
        throw new Error('ROLLBACK_TEST');
      }).catch((error) => {
        // Expected error for rollback
        if (error.message !== 'ROLLBACK_TEST') {
          throw error;
        }
      });
    });

    // Test 9: Connection Pool
    await runTest('Connection Pool Test', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        prisma.$queryRaw`SELECT ${i} as id`
      );
      await Promise.all(promises);
    });

    // Test 10: Query Performance
    await runTest('Query Performance Test', async () => {
      const start = Date.now();
      await prisma.user.findMany({ take: 10 });
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.log(`   ⚠️  Warning: Query took ${duration}ms (expected < 1000ms)`);
      } else {
        console.log(`   Query time: ${duration}ms`);
      }
    });

  } catch (error) {
    console.error('\n❌ Unexpected error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }

  // Print Summary
  console.log('\n' + '━'.repeat(60));
  console.log('📊 Test Summary\n');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    console.log('\nFailed Tests:');
    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`  • ${r.name}: ${r.message}`);
      });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Database connection is healthy.');
    process.exit(0);
  }
}

// Run tests
testDatabaseConnection().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
