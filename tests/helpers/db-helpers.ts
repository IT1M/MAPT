import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Database cleanup utilities
 */
export class DatabaseCleaner {
  /**
   * Clean all test data
   */
  static async cleanAll() {
    await this.cleanAuditLogs();
    await this.cleanInventoryItems();
    await this.cleanSessions();
    await this.cleanUsers();
  }

  /**
   * Clean test users
   */
  static async cleanUsers() {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test-' } },
          { email: { contains: '@example.com' } },
          { email: { contains: '@test.com' } },
        ],
      },
    });
  }

  /**
   * Clean test inventory items
   */
  static async cleanInventoryItems() {
    await prisma.inventoryItem.deleteMany({
      where: {
        OR: [
          { itemName: { contains: 'Test Item' } },
          { batch: { contains: 'BATCH-' } },
          { notes: { contains: 'test' } },
        ],
      },
    });
  }

  /**
   * Clean test sessions
   */
  static async cleanSessions() {
    await prisma.session.deleteMany({
      where: {
        sessionToken: { contains: 'test-session' },
      },
    });
  }

  /**
   * Clean test audit logs
   */
  static async cleanAuditLogs() {
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { action: { contains: 'TEST_' } },
          { user: { email: { contains: 'test-' } } },
        ],
      },
    });
  }

  /**
   * Clean specific user's data
   */
  static async cleanUserData(userId: string) {
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.inventoryItem.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  }

  /**
   * Reset database to clean state
   */
  static async reset() {
    // Delete all data in reverse order of dependencies
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.report.deleteMany();
    await prisma.backup.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  }
}

/**
 * Database seeding utilities
 */
export class DatabaseSeeder {
  /**
   * Seed test users with different roles
   */
  static async seedTestUsers() {
    const users = [];

    const roles = ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR'];

    for (const role of roles) {
      const user = await prisma.user.create({
        data: {
          email: `test-${role.toLowerCase()}@example.com`,
          name: `Test ${role}`,
          password:
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEmu4G',
          role: role as any,
          isActive: true,
        },
      });
      users.push(user);
    }

    return users;
  }

  /**
   * Seed test inventory items
   */
  static async seedTestInventory(userId: string, count: number = 10) {
    const items = [];

    for (let i = 0; i < count; i++) {
      const item = await prisma.inventoryItem.create({
        data: {
          itemName: `Test Item ${i + 1}`,
          batch: `BATCH-TEST-${Date.now()}-${i}`,
          quantity: Math.floor(Math.random() * 100) + 10,
          reject: Math.floor(Math.random() * 5),
          destination: ['WAREHOUSE_A', 'WAREHOUSE_B', 'WAREHOUSE_C'][i % 3],
          notes: `Test inventory item ${i + 1}`,
          userId,
        },
      });
      items.push(item);
    }

    return items;
  }
}

/**
 * Transaction helper
 */
export async function withTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

/**
 * Check if database is connected
 */
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

export { prisma };
