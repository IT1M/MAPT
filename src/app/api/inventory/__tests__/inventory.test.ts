import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/services/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/prisma', () => ({
  prisma: {
    inventoryItem: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/utils/constants', () => ({
  DEFAULT_PAGE_SIZE: 20,
  PERMISSIONS: {
    ADMIN: ['inventory:read', 'inventory:write', 'inventory:delete'],
    DATA_ENTRY: ['inventory:read', 'inventory:write'],
    SUPERVISOR: ['inventory:read', 'inventory:write', 'inventory:delete'],
    MANAGER: ['inventory:read'],
    AUDITOR: ['inventory:read'],
  },
}));

import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { GET, POST } from '../route';

describe('Inventory API Routes', () => {
  describe('GET /api/inventory', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return paginated inventory items', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
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
          enteredBy: {
            id: 'user-123',
            name: 'John Doe',
            email: 'test@example.com',
          },
        },
      ];

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.count).mockResolvedValue(1);
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
        mockItems as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/inventory?page=1&limit=50'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(1);
      expect(data.data.pagination.total).toBe(1);
    });

    it('should filter by search term', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'MANAGER',
          permissions: ['inventory:read'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.count).mockResolvedValue(0);
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory?search=medical'
      );

      await GET(request);

      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                itemName: expect.objectContaining({
                  contains: 'medical',
                }),
              }),
            ]),
          }),
        })
      );
    });

    it('should filter by destination', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'MANAGER',
          permissions: ['inventory:read'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.count).mockResolvedValue(0);
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory?destination=MAIS'
      );

      await GET(request);

      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            destination: 'MAIS',
          }),
        })
      );
    });

    it('should apply role-based filtering for DATA_ENTRY users', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'DATA_ENTRY',
          permissions: ['inventory:read'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.count).mockResolvedValue(0);
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/inventory');

      await GET(request);

      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            enteredById: 'user-123',
          }),
        })
      );
    });

    it('should reject unauthenticated request', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/inventory');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should reject request without permissions', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          permissions: [],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/inventory');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/inventory', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create inventory item successfully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          permissions: ['inventory:write'],
        },
      };

      const mockItem = {
        id: 'item-1',
        itemName: 'Medical Supplies',
        batch: 'BATCH-001',
        quantity: 100,
        reject: 5,
        destination: 'MAIS',
        enteredById: 'user-123',
        enteredBy: {
          id: 'user-123',
          name: 'John Doe',
          email: 'test@example.com',
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.create).mockResolvedValue(mockItem as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const request = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          itemName: 'Medical Supplies',
          batch: 'BATCH-001',
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.itemName).toBe('Medical Supplies');
      expect(prisma.inventoryItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            enteredById: 'user-123',
          }),
        })
      );
    });

    it('should reject invalid data', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          permissions: ['inventory:write'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          itemName: 'M',
          batch: 'BATCH-001',
          quantity: -10,
          destination: 'MAIS',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should sanitize string inputs', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          permissions: ['inventory:write'],
        },
      };

      const mockItem = {
        id: 'item-1',
        itemName: 'Medical Supplies',
        batch: 'BATCH-001',
        quantity: 100,
        reject: 0,
        destination: 'MAIS',
        enteredById: 'user-123',
        enteredBy: {
          id: 'user-123',
          name: 'John Doe',
          email: 'test@example.com',
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.create).mockResolvedValue(mockItem as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const request = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          itemName: 'Medical Supplies',
          batch: 'BATCH-001',
          quantity: 100,
          destination: 'MAIS',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.itemName).toBe('Medical Supplies');
    });

    it('should create audit log entry', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          permissions: ['inventory:write'],
        },
      };

      const mockItem = {
        id: 'item-1',
        itemName: 'Medical Supplies',
        batch: 'BATCH-001',
        quantity: 100,
        reject: 0,
        destination: 'MAIS',
        enteredById: 'user-123',
        enteredBy: {
          id: 'user-123',
          name: 'John Doe',
          email: 'test@example.com',
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.create).mockResolvedValue(mockItem as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const request = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          itemName: 'Medical Supplies',
          batch: 'BATCH-001',
          quantity: 100,
          destination: 'MAIS',
        }),
      });

      await POST(request);

      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
