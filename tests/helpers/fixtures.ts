import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a test user
 */
export async function createTestUser(overrides: any = {}) {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEmu4G', // hashed "Test123!@#"
    role: 'DATA_ENTRY',
    isActive: true,
    ...overrides,
  };

  return await prisma.user.create({
    data: defaultUser,
  });
}

/**
 * Create a test inventory item
 */
export async function createTestItem(userId: string, overrides: any = {}) {
  const defaultItem = {
    itemName: `Test Item ${Date.now()}`,
    batch: `BATCH-${Date.now()}`,
    quantity: 100,
    reject: 5,
    destination: 'WAREHOUSE_A',
    notes: 'Test item for automated testing',
    userId,
    ...overrides,
  };

  return await prisma.inventoryItem.create({
    data: defaultItem,
  });
}

/**
 * Create multiple test items
 */
export async function createTestItems(userId: string, count: number = 5) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const item = await createTestItem(userId, {
      itemName: `Test Item ${i + 1}`,
      batch: `BATCH-${Date.now()}-${i}`,
    });
    items.push(item);
  }
  return items;
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  // Delete in order to respect foreign key constraints
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { user: { email: { contains: 'test-' } } },
        { user: { email: { contains: '@example.com' } } },
      ],
    },
  });

  await prisma.inventoryItem.deleteMany({
    where: {
      OR: [
        { user: { email: { contains: 'test-' } } },
        { user: { email: { contains: '@example.com' } } },
      ],
    },
  });

  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { contains: 'test-' } },
        { email: { contains: '@example.com' } },
      ],
    },
  });
}

/**
 * Create test session
 */
export async function createTestSession(userId: string) {
  return await prisma.session.create({
    data: {
      userId,
      sessionToken: `test-session-${Date.now()}`,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });
}

export { prisma };
