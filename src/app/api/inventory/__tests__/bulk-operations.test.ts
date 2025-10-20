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
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { POST as bulkDelete } from '../bulk-delete/route';
import { POST as bulkUpdate } from '../bulk-update/route';

describe('Bulk Operations API Routes', () => {
  describe('POST /api/inventory/bulk-delete', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should bulk delete items successfully for SUPERVISOR', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'SUPERVISOR',
          permissions: ['inventory:delete'],
        },
      };

      const mockItems = [
        {
          id: 'item-1',
          itemName: 'Item 1',
          batch: 'BATCH-001',
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          deletedAt: null,
          enteredById: 'user-456',
          enteredBy: {
            id: 'user-456',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
        {
          id: 'item-2',
          itemName: 'Item 2',
          batch: 'BATCH-002',
          quantity: 200,
          reject: 10,
          destination: 'FOZAN',
          deletedAt: null,
          enteredById: 'user-456',
          enteredBy: {
            id: 'user-456',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      const mockAuditLog = {
        id: 'audit-1',
        userId: 'user-123',
        action: 'DELETE',
        entityType: 'InventoryItem',
        entityId: 'item-1',
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
        mockItems as any
      );
      vi.mocked(prisma.inventoryItem.updateMany).mockResolvedValue({
        count: 2,
      } as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1', 'item-2'],
          }),
        }
      );

      const response = await bulkDelete(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deletedCount).toBe(2);
      expect(data.data.auditLogIds).toHaveLength(2);
      expect(prisma.inventoryItem.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['item-1', 'item-2'] },
          deletedAt: null,
        },
        data: {
          deletedAt: expect.any(Date),
        },
      });
    });

    it('should bulk delete items successfully for ADMIN', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'ADMIN',
          permissions: ['inventory:delete'],
        },
      };

      const mockItems = [
        {
          id: 'item-1',
          itemName: 'Item 1',
          batch: 'BATCH-001',
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          deletedAt: null,
          enteredById: 'user-456',
          enteredBy: {
            id: 'user-456',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      const mockAuditLog = {
        id: 'audit-1',
        userId: 'user-123',
        action: 'DELETE',
        entityType: 'InventoryItem',
        entityId: 'item-1',
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
        mockItems as any
      );
      vi.mocked(prisma.inventoryItem.updateMany).mockResolvedValue({
        count: 1,
      } as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1'],
          }),
        }
      );

      const response = await bulkDelete(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deletedCount).toBe(1);
    });

    it('should reject bulk delete for DATA_ENTRY role', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'DATA_ENTRY',
          permissions: ['inventory:delete'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1', 'item-2'],
          }),
        }
      );

      const response = await bulkDelete(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('supervisors and administrators');
    });

    it('should reject unauthenticated request', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1'],
          }),
        }
      );

      const response = await bulkDelete(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should reject request without permissions', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'SUPERVISOR',
          permissions: [],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1'],
          }),
        }
      );

      const response = await bulkDelete(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should validate empty ids array', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'SUPERVISOR',
          permissions: ['inventory:delete'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: [],
          }),
        }
      );

      const response = await bulkDelete(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate maximum 100 items', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'SUPERVISOR',
          permissions: ['inventory:delete'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const ids = Array.from({ length: 101 }, (_, i) => `item-${i}`);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({ ids }),
        }
      );

      const response = await bulkDelete(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle no valid items found', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'SUPERVISOR',
          permissions: ['inventory:delete'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['non-existent-id'],
          }),
        }
      );

      const response = await bulkDelete(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('No valid items found');
    });

    it('should create audit log for each deleted item', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'ADMIN',
          permissions: ['inventory:delete'],
        },
      };

      const mockItems = [
        {
          id: 'item-1',
          itemName: 'Item 1',
          batch: 'BATCH-001',
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          deletedAt: null,
          enteredById: 'user-456',
          enteredBy: {
            id: 'user-456',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
        {
          id: 'item-2',
          itemName: 'Item 2',
          batch: 'BATCH-002',
          quantity: 200,
          reject: 10,
          destination: 'FOZAN',
          deletedAt: null,
          enteredById: 'user-456',
          enteredBy: {
            id: 'user-456',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      const mockAuditLog = {
        id: 'audit-1',
        userId: 'user-123',
        action: 'DELETE',
        entityType: 'InventoryItem',
        entityId: 'item-1',
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
        mockItems as any
      );
      vi.mocked(prisma.inventoryItem.updateMany).mockResolvedValue({
        count: 2,
      } as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1', 'item-2'],
          }),
        }
      );

      await bulkDelete(request);

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /api/inventory/bulk-update', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should bulk update destination successfully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'SUPERVISOR',
          permissions: ['inventory:write'],
        },
      };

      const mockItemsBefore = [
        {
          id: 'item-1',
          itemName: 'Item 1',
          batch: 'BATCH-001',
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          deletedAt: null,
          enteredById: 'user-456',
          enteredBy: {
            id: 'user-456',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      const mockItemsAfter = [
        {
          ...mockItemsBefore[0],
          destination: 'FOZAN',
        },
      ];

      const mockAuditLog = {
        id: 'audit-1',
        userId: 'user-123',
        action: 'UPDATE',
        entityType: 'InventoryItem',
        entityId: 'item-1',
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.findMany)
        .mockResolvedValueOnce(mockItemsBefore as any)
        .mockResolvedValueOnce(mockItemsAfter as any);
      vi.mocked(prisma.inventoryItem.updateMany).mockResolvedValue({
        count: 1,
      } as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-update',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1'],
            updates: {
              destination: 'FOZAN',
            },
          }),
        }
      );

      const response = await bulkUpdate(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedCount).toBe(1);
      expect(data.data.auditLogIds).toHaveLength(1);
    });

    it('should bulk update category successfully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'DATA_ENTRY',
          permissions: ['inventory:write'],
        },
      };

      const mockItemsBefore = [
        {
          id: 'item-1',
          itemName: 'Item 1',
          batch: 'BATCH-001',
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          category: 'Old Category',
          deletedAt: null,
          enteredById: 'user-123',
          enteredBy: {
            id: 'user-123',
            name: 'Current User',
            email: 'current@example.com',
          },
        },
      ];

      const mockItemsAfter = [
        {
          ...mockItemsBefore[0],
          category: 'New Category',
        },
      ];

      const mockAuditLog = {
        id: 'audit-1',
        userId: 'user-123',
        action: 'UPDATE',
        entityType: 'InventoryItem',
        entityId: 'item-1',
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.findMany)
        .mockResolvedValueOnce(mockItemsBefore as any)
        .mockResolvedValueOnce(mockItemsAfter as any);
      vi.mocked(prisma.inventoryItem.updateMany).mockResolvedValue({
        count: 1,
      } as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-update',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1'],
            updates: {
              category: 'New Category',
            },
          }),
        }
      );

      const response = await bulkUpdate(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedCount).toBe(1);
    });

    it('should reject DATA_ENTRY user updating items they did not create', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'DATA_ENTRY',
          permissions: ['inventory:write'],
        },
      };

      const mockItems = [
        {
          id: 'item-1',
          itemName: 'Item 1',
          batch: 'BATCH-001',
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          deletedAt: null,
          enteredById: 'user-456', // Different user
          enteredBy: {
            id: 'user-456',
            name: 'Other User',
            email: 'other@example.com',
          },
        },
      ];

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(
        mockItems as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-update',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1'],
            updates: {
              destination: 'FOZAN',
            },
          }),
        }
      );

      const response = await bulkUpdate(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('items you created');
    });

    it('should reject unauthenticated request', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-update',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1'],
            updates: { destination: 'FOZAN' },
          }),
        }
      );

      const response = await bulkUpdate(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should reject request without permissions', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'SUPERVISOR',
          permissions: [],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-update',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1'],
            updates: { destination: 'FOZAN' },
          }),
        }
      );

      const response = await bulkUpdate(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should validate empty ids array', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'SUPERVISOR',
          permissions: ['inventory:write'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-update',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: [],
            updates: { destination: 'FOZAN' },
          }),
        }
      );

      const response = await bulkUpdate(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate empty updates object', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'SUPERVISOR',
          permissions: ['inventory:write'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-update',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1'],
            updates: {},
          }),
        }
      );

      const response = await bulkUpdate(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate maximum 100 items', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'SUPERVISOR',
          permissions: ['inventory:write'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const ids = Array.from({ length: 101 }, (_, i) => `item-${i}`);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-update',
        {
          method: 'POST',
          body: JSON.stringify({
            ids,
            updates: { destination: 'FOZAN' },
          }),
        }
      );

      const response = await bulkUpdate(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle no valid items found', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'SUPERVISOR',
          permissions: ['inventory:write'],
        },
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-update',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['non-existent-id'],
            updates: { destination: 'FOZAN' },
          }),
        }
      );

      const response = await bulkUpdate(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('No valid items found');
    });

    it('should create audit log for each updated item', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          role: 'ADMIN',
          permissions: ['inventory:write'],
        },
      };

      const mockItemsBefore = [
        {
          id: 'item-1',
          itemName: 'Item 1',
          batch: 'BATCH-001',
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          deletedAt: null,
          enteredById: 'user-456',
          enteredBy: {
            id: 'user-456',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
        {
          id: 'item-2',
          itemName: 'Item 2',
          batch: 'BATCH-002',
          quantity: 200,
          reject: 10,
          destination: 'MAIS',
          deletedAt: null,
          enteredById: 'user-456',
          enteredBy: {
            id: 'user-456',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ];

      const mockItemsAfter = mockItemsBefore.map((item) => ({
        ...item,
        destination: 'FOZAN',
      }));

      const mockAuditLog = {
        id: 'audit-1',
        userId: 'user-123',
        action: 'UPDATE',
        entityType: 'InventoryItem',
        entityId: 'item-1',
      };

      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.inventoryItem.findMany)
        .mockResolvedValueOnce(mockItemsBefore as any)
        .mockResolvedValueOnce(mockItemsAfter as any);
      vi.mocked(prisma.inventoryItem.updateMany).mockResolvedValue({
        count: 2,
      } as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any);

      const request = new NextRequest(
        'http://localhost:3000/api/inventory/bulk-update',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: ['item-1', 'item-2'],
            updates: {
              destination: 'FOZAN',
            },
          }),
        }
      );

      await bulkUpdate(request);

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(2);
    });
  });
});
