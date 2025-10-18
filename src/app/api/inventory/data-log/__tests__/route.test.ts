import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/services/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/services/prisma', () => ({
  prisma: {
    inventoryItem: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/utils/constants', () => ({
  DEFAULT_PAGE_SIZE: 25,
}))

import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { GET } from '../route'

describe('Data Log API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return paginated data with aggregates', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'MANAGER',
        permissions: ['inventory:read'],
      },
    }

    const mockItems = [
      {
        id: 'item-1',
        itemName: 'Medical Supplies',
        batch: 'BATCH-001',
        quantity: 100,
        reject: 10,
        destination: 'MAIS',
        category: 'Medical',
        enteredById: 'user-123',
        deletedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        enteredBy: {
          id: 'user-123',
          name: 'John Doe',
          email: 'test@example.com',
        },
      },
      {
        id: 'item-2',
        itemName: 'Surgical Tools',
        batch: 'BATCH-002',
        quantity: 50,
        reject: 5,
        destination: 'FOZAN',
        category: 'Surgical',
        enteredById: 'user-456',
        deletedAt: null,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        enteredBy: {
          id: 'user-456',
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
      },
    ]

    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.inventoryItem.count).mockResolvedValue(2)
    vi.mocked(prisma.inventoryItem.findMany)
      .mockResolvedValueOnce(mockItems as any)
      .mockResolvedValueOnce(mockItems as any)

    const request = new NextRequest('http://localhost:3000/api/inventory/data-log?page=1&pageSize=25')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.items).toHaveLength(2)
    expect(data.data.items[0].rejectPercentage).toBe(10)
    expect(data.data.items[1].rejectPercentage).toBe(10)
    expect(data.data.aggregates.totalQuantity).toBe(150)
    expect(data.data.aggregates.totalRejects).toBe(15)
    expect(data.data.aggregates.averageRejectRate).toBe(10)
  })

  it('should filter by search term', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        role: 'MANAGER',
        permissions: ['inventory:read'],
      },
    }

    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.inventoryItem.count).mockResolvedValue(0)
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/inventory/data-log?search=medical')

    await GET(request)

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
    )
  })

  it('should filter by multiple destinations', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        role: 'MANAGER',
        permissions: ['inventory:read'],
      },
    }

    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.inventoryItem.count).mockResolvedValue(0)
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/inventory/data-log?destination=MAIS&destination=FOZAN')

    await GET(request)

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          destination: {
            in: ['MAIS', 'FOZAN'],
          },
        }),
      })
    )
  })

  it('should filter by reject status - none', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        role: 'MANAGER',
        permissions: ['inventory:read'],
      },
    }

    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.inventoryItem.count).mockResolvedValue(0)
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/inventory/data-log?rejectFilter=none')

    await GET(request)

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reject: 0,
        }),
      })
    )
  })

  it('should filter by reject status - has rejects', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        role: 'MANAGER',
        permissions: ['inventory:read'],
      },
    }

    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.inventoryItem.count).mockResolvedValue(0)
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/inventory/data-log?rejectFilter=has')

    await GET(request)

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reject: {
            gt: 0,
          },
        }),
      })
    )
  })

  it('should apply role-based filtering for DATA_ENTRY users', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        role: 'DATA_ENTRY',
        permissions: ['inventory:read'],
      },
    }

    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.inventoryItem.count).mockResolvedValue(0)
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/inventory/data-log')

    await GET(request)

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          enteredById: 'user-123',
        }),
      })
    )
  })

  it('should allow ADMIN to filter by entered by user', async () => {
    const mockSession = {
      user: {
        id: 'admin-123',
        role: 'ADMIN',
        permissions: ['inventory:read', 'audit:view'],
      },
    }

    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.inventoryItem.count).mockResolvedValue(0)
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/inventory/data-log?enteredBy=user-123&enteredBy=user-456')

    await GET(request)

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          enteredById: {
            in: ['user-123', 'user-456'],
          },
        }),
      })
    )
  })

  it('should reject unauthenticated request', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const request = new NextRequest('http://localhost:3000/api/inventory/data-log')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('should reject request without permissions', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        permissions: [],
      },
    }

    vi.mocked(auth).mockResolvedValue(mockSession as any)

    const request = new NextRequest('http://localhost:3000/api/inventory/data-log')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
  })
})
