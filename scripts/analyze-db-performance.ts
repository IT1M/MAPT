#!/usr/bin/env tsx

/**
 * Database Performance Analysis Script
 * 
 * Analyzes database queries and provides optimization recommendations
 * 
 * Usage: npm run analyze:db
 */

import { prisma } from '../src/services/prisma';

interface QueryStats {
  name: string;
  duration: number;
  count: number;
}

const queryStats: QueryStats[] = [];

async function testQuery(name: string, queryFn: () => Promise<any>) {
  const iterations = 5;
  let totalDuration = 0;

  console.log(`\n🔍 Testing: ${name}`);

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await queryFn();
    const duration = Date.now() - start;
    totalDuration += duration;
    console.log(`  Iteration ${i + 1}: ${duration}ms`);
  }

  const avgDuration = totalDuration / iterations;
  queryStats.push({ name, duration: avgDuration, count: iterations });

  console.log(`  Average: ${avgDuration.toFixed(2)}ms`);

  if (avgDuration > 1000) {
    console.log(`  ⚠️  SLOW QUERY - Consider optimization`);
  } else if (avgDuration > 500) {
    console.log(`  ⚡ Moderate performance`);
  } else {
    console.log(`  ✅ Good performance`);
  }
}

async function analyzeDatabase() {
  console.log('📊 Database Performance Analysis\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Simple inventory query
    await testQuery('Simple inventory query (50 items)', async () => {
      await prisma.inventoryItem.findMany({
        take: 50,
        where: { deletedAt: null },
      });
    });

    // Test 2: Inventory with user relation
    await testQuery('Inventory with user relation (50 items)', async () => {
      await prisma.inventoryItem.findMany({
        take: 50,
        where: { deletedAt: null },
        include: {
          enteredBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    // Test 3: Filtered inventory query
    await testQuery('Filtered inventory query (by destination)', async () => {
      await prisma.inventoryItem.findMany({
        where: {
          destination: 'MAIS',
          deletedAt: null,
        },
        take: 50,
      });
    });

    // Test 4: Inventory count
    await testQuery('Inventory count', async () => {
      await prisma.inventoryItem.count({
        where: { deletedAt: null },
      });
    });

    // Test 5: Inventory aggregation
    await testQuery('Inventory aggregation', async () => {
      await prisma.inventoryItem.aggregate({
        where: { deletedAt: null },
        _sum: {
          quantity: true,
          reject: true,
        },
        _count: true,
      });
    });

    // Test 6: Audit logs query
    await testQuery('Audit logs query (50 items)', async () => {
      await prisma.auditLog.findMany({
        take: 50,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });

    // Test 7: Complex query with multiple filters
    await testQuery('Complex filtered query', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await prisma.inventoryItem.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          destination: 'MAIS',
          deletedAt: null,
        },
        include: {
          enteredBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    // Test 8: Group by query
    await testQuery('Group by destination', async () => {
      await prisma.inventoryItem.groupBy({
        by: ['destination'],
        where: { deletedAt: null },
        _sum: {
          quantity: true,
        },
        _count: true,
      });
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 Performance Summary\n');

    const sortedStats = [...queryStats].sort((a, b) => b.duration - a.duration);

    console.log('Slowest Queries:');
    sortedStats.slice(0, 3).forEach((stat, index) => {
      const status = stat.duration > 1000 ? '⚠️' : stat.duration > 500 ? '⚡' : '✅';
      console.log(`  ${index + 1}. ${status} ${stat.name}: ${stat.duration.toFixed(2)}ms`);
    });

    console.log('\n💡 Recommendations:\n');

    const slowQueries = queryStats.filter((q) => q.duration > 500);
    if (slowQueries.length > 0) {
      console.log('  1. Consider adding indexes for slow queries');
      console.log('  2. Use select to limit returned fields');
      console.log('  3. Implement caching for frequently accessed data');
      console.log('  4. Use pagination for large result sets');
      console.log('  5. Consider using raw SQL for complex queries');
    } else {
      console.log('  ✅ All queries are performing well!');
      console.log('  Continue monitoring query performance in production.');
    }

    // Check database connection
    console.log('\n🔌 Database Connection:');
    const dbInfo = await prisma.$queryRaw`SELECT version()`;
    console.log('  ✅ Connected successfully');
    console.log(`  Database: PostgreSQL`);

    // Check table sizes
    console.log('\n📦 Table Statistics:');
    const inventoryCount = await prisma.inventoryItem.count();
    const auditLogCount = await prisma.auditLog.count();
    const userCount = await prisma.user.count();
    const reportCount = await prisma.report.count();
    const backupCount = await prisma.backup.count();

    console.log(`  Inventory Items: ${inventoryCount.toLocaleString()}`);
    console.log(`  Audit Logs: ${auditLogCount.toLocaleString()}`);
    console.log(`  Users: ${userCount.toLocaleString()}`);
    console.log(`  Reports: ${reportCount.toLocaleString()}`);
    console.log(`  Backups: ${backupCount.toLocaleString()}`);

    if (inventoryCount > 10000) {
      console.log('\n  ⚠️  Large inventory table detected');
      console.log('     Consider implementing data archiving strategy');
    }

    if (auditLogCount > 50000) {
      console.log('\n  ⚠️  Large audit log table detected');
      console.log('     Consider implementing log rotation strategy');
    }

  } catch (error) {
    console.error('\n❌ Error during analysis:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n✨ Analysis complete!\n');
}

// Run analysis
analyzeDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
