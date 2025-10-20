import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/services/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/prisma', () => ({
  prisma: {
    inventoryItem: {
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({})),
    sheet_add_aoa: vi.fn(),
    sheet_add_json: vi.fn(),
    book_append_sheet: vi.fn(),
  },
  write: vi.fn(() => Buffer.from('mock-excel-data')),
}));

import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { POST } from '../excel/route';

describe('Excel Export API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset rate limiter between tests
    vi.resetModules();
  });

  it('should export inventory items as Excel', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'John Doe',
        role: 'MANAGER',
        permissions: ['inventory:read'],
      },
    };

    const mockItems = [
      {
        id: 'item-1',
        itemName: 'Medical Supplies',
        batch: 'BATCH-001',
        quantity: 100,
        reject: 5,
        destination: 'MAIS',
        category: 'Supplies',
        notes: 'Test notes',
        createdAt: new Date('2024-01-01'),
        enteredBy: {
          id: 'user-123',
          name: 'John Doe',
          email: 'test@example.com',
        },
      },
    ];

    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
      mockItems as any
    );
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/inventory/export/excel',
      {
        method: 'POST',
        body: JSON.stringify({
          filters: {
            search: 'medical',
          },
        }),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain(
      'spreadsheetml.sheet'
    );
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('should apply filters correctly', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        role: 'MANAGER',
        permissions: ['inventory:read'],
      },
    };

    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([]);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/inventory/export/excel',
      {
        method: 'POST',
        body: JSON.stringify({
          filters: {
            destinations: ['MAIS'],
            categories: ['Supplies'],
            rejectFilter: 'has',
          },
        }),
      }
    );

    await POST(request);

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          destination: { in: ['MAIS'] },
          category: { in: ['Supplies'] },
          reject: { gt: 0 },
        }),
      })
    );
  });

  it('should export selected items only', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        role: 'MANAGER',
        permissions: ['inventory:read'],
      },
    };

    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([]);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/inventory/export/excel',
      {
        method: 'POST',
        body: JSON.stringify({
          ids: ['item-1', 'item-2'],
        }),
      }
    );

    await POST(request);

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['item-1', 'item-2'] },
        }),
      })
    );
  });

  it('should enforce rate limiting', async () => {
    const mockSession = {
      user: {
        id: 'rate-limit-test-user',
        role: 'MANAGER',
        permissions: ['inventory:read'],
      },
    };

    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([]);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    // Make 11 requests (rate limit is 10 per 15 minutes)
    const requests = [];
    for (let i = 0; i < 11; i++) {
      const request = new NextRequest(
        'http://localhost:3000/api/inventory/export/excel',
        {
          method: 'POST',
          body: JSON.stringify({ filters: {} }),
        }
      );
      requests.push(POST(request));
    }

    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];

    expect(lastResponse.status).toBe(429);
    const data = await lastResponse.json();
    expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should reject unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const request = new NextRequest(
      'http://localhost:3000/api/inventory/export/excel',
      {
        method: 'POST',
        body: JSON.stringify({ filters: {} }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should reject requests without permissions', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        permissions: [],
      },
    };

    vi.mocked(auth).mockResolvedValue(mockSession as any);

    const request = new NextRequest(
      'http://localhost:3000/api/inventory/export/excel',
      {
        method: 'POST',
        body: JSON.stringify({ filters: {} }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('should apply role-based filtering for DATA_ENTRY users', async () => {
    const mockSession = {
      user: {
        id: 'data-entry-user-456',
        role: 'DATA_ENTRY',
        permissions: ['inventory:read'],
      },
    };

    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([]);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/inventory/export/excel',
      {
        method: 'POST',
        body: JSON.stringify({ filters: {} }),
      }
    );

    await POST(request);

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          enteredById: 'data-entry-user-456',
        }),
      })
    );
  });
});
