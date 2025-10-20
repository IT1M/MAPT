import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client for tests
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Setup before all tests
beforeAll(async () => {
  // Connect to database
  await prisma.$connect();
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});

// Reset state before each test
beforeEach(async () => {
  // Optional: Add any per-test setup here
});

// Cleanup after each test
afterEach(async () => {
  // Optional: Add any per-test cleanup here
});

// Export test utilities
export { expect, describe, it, test, vi } from 'vitest';
