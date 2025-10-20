import { vi } from 'vitest';

/**
 * Mock NextAuth session
 */
export function mockSession(overrides: any = {}) {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'DATA_ENTRY',
      ...overrides.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

/**
 * Mock authenticated request
 */
export function mockAuthRequest(session: any = null) {
  return {
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    method: 'GET',
    url: 'http://localhost:3000/api/test',
  };
}

/**
 * Mock Gemini AI service
 */
export const mockGeminiService = {
  generateInsights: vi.fn().mockResolvedValue({
    insights: ['Test insight 1', 'Test insight 2'],
    recommendations: ['Test recommendation'],
  }),
  answerQuestion: vi.fn().mockResolvedValue({
    answer: 'Test answer',
    confidence: 0.95,
  }),
};

/**
 * Mock Email service
 */
export const mockEmailService = {
  sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
  sendNotificationEmail: vi.fn().mockResolvedValue({ success: true }),
};

/**
 * Mock Prisma client
 */
export function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    inventoryItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(this)),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

/**
 * Mock fetch for API tests
 */
export function mockFetch(response: any, status: number = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
    headers: new Headers(),
  });
}

/**
 * Mock Next.js router
 */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
};

/**
 * Mock toast notifications
 */
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  custom: vi.fn(),
};

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks();
  mockGeminiService.generateInsights.mockClear();
  mockGeminiService.answerQuestion.mockClear();
  mockEmailService.sendWelcomeEmail.mockClear();
  mockEmailService.sendPasswordResetEmail.mockClear();
  mockEmailService.sendNotificationEmail.mockClear();
}
