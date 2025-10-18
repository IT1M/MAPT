import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getSummary } from '../summary/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/middleware/auth', () => ({
  checkAuth: vi.fn(),
}))

vi.mock('@/services/prisma', () => ({
  prisma: {
    inventoryItem: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { checkAuth } from '@/middleware/auth'
import { prisma } from '@/services/prisma'

describe('Analytics API Routes', () => {
  describe('GET /api/analytics/summary', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return analytics summary', async () => {
      const mockAuthResult = {
        context: {
          user: {
            id: 'user-123',
            role: 'MANAGER',
          },
        },
      }

      const mockItems = [
        {
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          category: 'Surgical',
          createdAt: new Date('2024-01-15'),
          enteredById: 'user-123',
        },
        {
          quantity: 200,
          reject: 10,
          destination: 'FOZAN',
          category: 'Medical',
          createdAt: new Date('2024-01-20'),
          enteredById: 'user-456',
        },
      ]

      vi.mocked(checkAuth).mockResolvedValue(mockAuthResult as any)
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(mockItems as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Test User' } as any)

      const request = new NextRequest('http://localhost:3000/api/analytics/summary')

      const response = await getSummary(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.totalItems).toBe(2)
      expect(data.data.totalQuantity).toBe(300)
      expect(data.data.rejectRate).toBe(5)
    })

    it('should group data by destination', async () => {
      const mockAuthResult = {
        context: {
          user: {
            id: 'user-123',
            role: 'MANAGER',
          },
        },
      }

      const mockItems = [
        {
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          category: 'Surgical',
          createdAt: new Date('2024-01-15'),
          enteredById: 'user-123',
        },
        {
          quantity: 200,
          reject: 10,
          destination: 'FOZAN',
          category: 'Medical',
          createdAt: new Date('2024-01-20'),
          enteredById: 'user-456',
        },
      ]

      vi.mocked(checkAuth).mockResolvedValue(mockAuthResult as any)
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(mockItems as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Test User' } as any)

      const request = new NextRequest('http://localhost:3000/api/analytics/summary')

      const response = await getSummary(request)
      const data = await response.json()

      expect(data.data.byDestination.MAIS.items).toBe(1)
      expect(data.data.byDestination.MAIS.quantity).toBe(100)
      expect(data.data.byDestination.FOZAN.items).toBe(1)
      expect(data.data.byDestination.FOZAN.quantity).toBe(200)
    })

    it('should group data by month', async () => {
      const mockAuthResult = {
        context: {
          user: {
            id: 'user-456',
            role: 'SUPERVISOR',
          },
        },
      }

      const mockItems = [
        {
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          category: 'Surgical',
          createdAt: new Date('2024-01-15'),
          enteredById: 'user-123',
        },
        {
          quantity: 200,
          reject: 10,
          destination: 'FOZAN',
          category: 'Medical',
          createdAt: new Date('2024-02-20'),
          enteredById: 'user-456',
        },
      ]

      vi.mocked(checkAuth).mockResolvedValue(mockAuthResult as any)
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(mockItems as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Test User' } as any)

      const request = new NextRequest('http://localhost:3000/api/analytics/summary')

      const response = await getSummary(request)
      const data = await response.json()

      expect(data.data.byMonth.length).toBeGreaterThanOrEqual(1)
      expect(data.data.byMonth[0].month).toMatch(/2024-\d{2}/)
    })

    it('should group data by category', async () => {
      const mockAuthResult = {
        context: {
          user: {
            id: 'user-789',
            role: 'AUDITOR',
          },
        },
      }

      const mockItems = [
        {
          quantity: 100,
          reject: 5,
          destination: 'MAIS',
          category: 'Surgical',
          createdAt: new Date('2024-01-15'),
          enteredById: 'user-123',
        },
        {
          quantity: 200,
          reject: 10,
          destination: 'FOZAN',
          category: 'Medical',
          createdAt: new Date('2024-01-20'),
          enteredById: 'user-456',
        },
        {
          quantity: 150,
          reject: 7,
          destination: 'MAIS',
          category: 'Surgical',
          createdAt: new Date('2024-01-25'),
          enteredById: 'user-789',
        },
      ]

      vi.mocked(checkAuth).mockResolvedValue(mockAuthResult as any)
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(mockItems as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Test User' } as any)

      const request = new NextRequest('http://localhost:3000/api/analytics/summary')

      const response = await getSummary(request)
      const data = await response.json()

      expect(data.data.byCategory.length).toBeGreaterThanOrEqual(1)
      const surgicalCategory = data.data.byCategory.find((c: any) => c.category === 'Surgical')
      expect(surgicalCategory).toBeDefined()
      expect(surgicalCategory.items).toBeGreaterThanOrEqual(1)
    })

    it('should calculate reject rate correctly', async () => {
      const mockAuthResult = {
        context: {
          user: {
            id: 'user-999',
            role: 'ADMIN',
          },
        },
      }

      const mockItems = [
        {
          quantity: 100,
          reject: 10,
          destination: 'MAIS',
          category: 'Surgical',
          createdAt: new Date('2024-01-15'),
          enteredById: 'user-999',
        },
      ]

      vi.mocked(checkAuth).mockResolvedValue(mockAuthResult as any)
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue(mockItems as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Test User' } as any)

      const request = new NextRequest('http://localhost:3000/api/analytics/summary')

      const response = await getSummary(request)
      const data = await response.json()

      expect(data.data.rejectRate).toBe(10)
    })

    it('should apply role-based filtering for DATA_ENTRY users', async () => {
      const mockAuthResult = {
        context: {
          user: {
            id: 'user-123',
            role: 'DATA_ENTRY',
          },
        },
      }

      vi.mocked(checkAuth).mockResolvedValue(mockAuthResult as any)
      vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/analytics/summary')

      await getSummary(request)

      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            enteredById: 'user-123',
          }),
        })
      )
    })
  })
})
