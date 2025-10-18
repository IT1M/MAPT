# Database Optimization Guide

This document outlines database optimization strategies for the Saudi Mais Inventory Management Application.

## Current Indexes

The Prisma schema includes the following indexes for optimal query performance:

### InventoryItem Indexes
```prisma
@@index([itemName])
@@index([batch])
@@index([createdAt])
@@index([destination])
@@index([itemName, batch])          // Composite index for common queries
@@index([createdAt, destination])   // Composite index for filtered queries
```

### AuditLog Indexes
```prisma
@@index([timestamp])
@@index([userId])
@@index([entityType, entityId])
@@index([action])
```

### Report Indexes
```prisma
@@index([generatedAt])
@@index([type])
@@index([status])
```

### Backup Indexes
```prisma
@@index([createdAt])
@@index([status])
@@index([type])
```

### Other Indexes
```prisma
@@index([email])              // User
@@index([nextRun])            // ReportSchedule
@@index([enabled])            // ReportSchedule
@@index([category])           // SystemSettings
```

## Query Optimization Techniques

### 1. Use Select to Limit Fields

❌ **Bad**: Fetch all fields
```typescript
const items = await prisma.inventoryItem.findMany();
```

✅ **Good**: Select only needed fields
```typescript
const items = await prisma.inventoryItem.findMany({
  select: {
    id: true,
    itemName: true,
    quantity: true,
    destination: true,
  },
});
```

### 2. Use Pagination

❌ **Bad**: Fetch all records
```typescript
const items = await prisma.inventoryItem.findMany();
```

✅ **Good**: Use cursor-based or offset pagination
```typescript
// Cursor-based (recommended for large datasets)
const items = await prisma.inventoryItem.findMany({
  take: 50,
  skip: 1,
  cursor: {
    id: lastItemId,
  },
});

// Offset-based (simpler, but slower for large offsets)
const items = await prisma.inventoryItem.findMany({
  take: 50,
  skip: page * 50,
});
```

### 3. Use Composite Indexes

For queries with multiple WHERE conditions, use composite indexes:

```typescript
// Query
const items = await prisma.inventoryItem.findMany({
  where: {
    itemName: 'Product A',
    batch: 'B123',
  },
});

// Optimized with composite index
@@index([itemName, batch])
```

### 4. Avoid N+1 Queries

❌ **Bad**: N+1 query problem
```typescript
const items = await prisma.inventoryItem.findMany();
for (const item of items) {
  const user = await prisma.user.findUnique({
    where: { id: item.enteredById },
  });
}
```

✅ **Good**: Use include or select with relations
```typescript
const items = await prisma.inventoryItem.findMany({
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
```

### 5. Use Aggregations Efficiently

```typescript
// Count records efficiently
const count = await prisma.inventoryItem.count({
  where: { destination: 'MAIS' },
});

// Aggregate data
const stats = await prisma.inventoryItem.aggregate({
  where: { destination: 'MAIS' },
  _sum: {
    quantity: true,
    reject: true,
  },
  _avg: {
    quantity: true,
  },
  _count: true,
});
```

### 6. Use Transactions for Multiple Operations

```typescript
await prisma.$transaction(async (tx) => {
  const item = await tx.inventoryItem.create({
    data: { ... },
  });
  
  await tx.auditLog.create({
    data: {
      action: 'CREATE',
      entityType: 'InventoryItem',
      entityId: item.id,
      userId: userId,
    },
  });
});
```

### 7. Use Raw Queries for Complex Operations

For complex queries that Prisma doesn't optimize well:

```typescript
const result = await prisma.$queryRaw`
  SELECT 
    destination,
    COUNT(*) as count,
    SUM(quantity) as total_quantity
  FROM inventory_items
  WHERE created_at >= ${startDate}
  GROUP BY destination
`;
```

## Connection Pooling

### Configuration

```typescript
// src/services/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Production Configuration

For production with connection pooling (PgBouncer):

```env
# .env.production
DATABASE_URL="postgresql://user:password@host:5432/db?pgbouncer=true&connection_limit=10"
```

## Query Performance Monitoring

### Enable Query Logging

```typescript
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

### Slow Query Detection

```typescript
import { logger } from '@/services/logger';

prisma.$on('query', (e) => {
  if (e.duration > 1000) { // Queries taking more than 1 second
    logger.warn('Slow query detected', {
      query: e.query,
      duration: e.duration,
      params: e.params,
    });
  }
});
```

## Common Query Patterns

### 1. Inventory List with Filters

```typescript
async function getInventoryItems({
  page = 1,
  limit = 50,
  itemName,
  destination,
  startDate,
  endDate,
}: FilterOptions) {
  const where: Prisma.InventoryItemWhereInput = {
    deletedAt: null,
  };

  if (itemName) {
    where.itemName = { contains: itemName, mode: 'insensitive' };
  }

  if (destination) {
    where.destination = destination;
  }

  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      select: {
        id: true,
        itemName: true,
        batch: true,
        quantity: true,
        reject: true,
        destination: true,
        createdAt: true,
        enteredBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return { items, total, page, limit };
}
```

### 2. Analytics Dashboard

```typescript
async function getDashboardStats(startDate: Date, endDate: Date) {
  // Use Promise.all for parallel queries
  const [totalItems, itemsByDestination, recentActivity] = await Promise.all([
    // Total items
    prisma.inventoryItem.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      _sum: {
        quantity: true,
        reject: true,
      },
      _count: true,
    }),

    // Items by destination
    prisma.inventoryItem.groupBy({
      by: ['destination'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      _sum: {
        quantity: true,
      },
      _count: true,
    }),

    // Recent activity
    prisma.inventoryItem.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      select: {
        id: true,
        itemName: true,
        quantity: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    totalItems,
    itemsByDestination,
    recentActivity,
  };
}
```

### 3. Audit Log with Pagination

```typescript
async function getAuditLogs({
  page = 1,
  limit = 50,
  userId,
  action,
  startDate,
  endDate,
}: AuditFilterOptions) {
  const where: Prisma.AuditLogWhereInput = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.timestamp = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      select: {
        id: true,
        timestamp: true,
        action: true,
        entityType: true,
        entityId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, limit };
}
```

## Database Maintenance

### 1. Vacuum and Analyze (PostgreSQL)

Run periodically to optimize database:

```sql
-- Vacuum to reclaim storage
VACUUM ANALYZE inventory_items;
VACUUM ANALYZE audit_logs;

-- Full vacuum (requires exclusive lock)
VACUUM FULL inventory_items;
```

### 2. Index Maintenance

Check index usage:

```sql
-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

### 3. Query Performance Analysis

```sql
-- Enable query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Best Practices

### 1. Always Use Indexes for WHERE Clauses

Ensure all frequently used WHERE conditions have indexes.

### 2. Limit Result Sets

Always use pagination or limits to avoid fetching too much data.

### 3. Use Transactions Wisely

Use transactions for related operations, but keep them short.

### 4. Cache Expensive Queries

Cache results of expensive queries using the caching utilities.

### 5. Monitor Query Performance

Regularly review slow queries and optimize them.

### 6. Use Connection Pooling

Always use connection pooling in production.

### 7. Avoid SELECT *

Always specify the fields you need.

### 8. Use Batch Operations

For multiple inserts/updates, use batch operations:

```typescript
await prisma.inventoryItem.createMany({
  data: items,
  skipDuplicates: true,
});
```

## Performance Targets

- **Simple queries**: < 50ms
- **Complex queries**: < 200ms
- **Aggregations**: < 500ms
- **Reports**: < 2s

## Troubleshooting

### Slow Queries

1. Check if indexes exist
2. Analyze query execution plan
3. Consider adding composite indexes
4. Use raw SQL for complex queries

### High Memory Usage

1. Reduce result set size
2. Use pagination
3. Limit included relations
4. Use select instead of include

### Connection Pool Exhaustion

1. Increase connection limit
2. Reduce query execution time
3. Use connection pooling (PgBouncer)
4. Close connections properly

## Monitoring Script

Create a script to monitor database performance:

```typescript
// scripts/monitor-db-performance.ts
import { prisma } from '@/services/prisma';

async function monitorPerformance() {
  const start = Date.now();
  
  // Test query performance
  await prisma.inventoryItem.findMany({
    take: 100,
  });
  
  const duration = Date.now() - start;
  
  console.log(`Query took ${duration}ms`);
  
  if (duration > 100) {
    console.warn('⚠️  Slow query detected');
  }
}

monitorPerformance();
```

## Additional Indexes to Consider

If you notice slow queries, consider adding these indexes:

```prisma
// For user activity queries
@@index([userId, timestamp]) on AuditLog

// For report filtering
@@index([type, generatedAt]) on Report

// For backup management
@@index([status, createdAt]) on Backup

// For inventory search
@@index([itemName, createdAt]) on InventoryItem
```

Add these to your schema and run:

```bash
npx prisma migrate dev --name add_performance_indexes
```
