import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GeminiService } from '../gemini'
import type { InventoryData, MonthlyData, InventoryContext } from '../gemini'

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockRejectedValue(new Error('Mocked API - use fallback')),
    }),
  })),
}))

describe('GeminiService', () => {
  let geminiService: GeminiService

  beforeEach(() => {
    vi.clearAllMocks()
    geminiService = GeminiService.getInstance()
    geminiService.clearCache()
  })

  afterEach(() => {
    geminiService.clearCache()
  })

  describe('analyzeInventoryTrends', () => {
    it('should return fallback trends when API is unavailable', async () => {
      const mockData: InventoryData[] = [
        {
          productId: 'prod-1',
          productName: 'Medical Supplies',
          currentStock: 15,
          minStockLevel: 20,
          maxStockLevel: 100,
          reorderPoint: 30,
        },
      ]

      const result = await geminiService.analyzeInventoryTrends(mockData)

      expect(result).toHaveLength(1)
      expect(result[0].product).toBe('Medical Supplies')
      expect(result[0].trend).toBe('decreasing')
      expect(result[0].confidence).toBe(0.5)
    })

    it('should detect stable trend for adequate stock', async () => {
      const mockData: InventoryData[] = [
        {
          productId: 'prod-1',
          productName: 'Medical Supplies',
          currentStock: 50,
          minStockLevel: 20,
          maxStockLevel: 100,
          reorderPoint: 30,
        },
      ]

      const result = await geminiService.analyzeInventoryTrends(mockData)

      expect(result).toHaveLength(1)
      expect(result[0].product).toBe('Medical Supplies')
      expect(result[0].trend).toBe('stable')
    })
  })

  describe('generateInsights', () => {
    it('should generate warning for low stock items', async () => {
      const mockData: InventoryData[] = [
        {
          productId: 'prod-1',
          productName: 'Medical Supplies',
          currentStock: 15,
          minStockLevel: 20,
          maxStockLevel: 100,
          reorderPoint: 30,
        },
      ]

      const result = await geminiService.generateInsights(mockData)

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].type).toBe('warning')
      expect(result[0].priority).toBe('high')
    })

    it('should generate info for overstocked items', async () => {
      const mockData: InventoryData[] = [
        {
          productId: 'prod-1',
          productName: 'Medical Supplies',
          currentStock: 150,
          minStockLevel: 20,
          maxStockLevel: 100,
          reorderPoint: 30,
        },
      ]

      const result = await geminiService.generateInsights(mockData)

      expect(result.length).toBeGreaterThan(0)
      expect(result.some(r => r.type === 'info')).toBe(true)
    })
  })

  describe('predictStockNeeds', () => {
    it('should predict stock needs with average usage data', async () => {
      const mockData: InventoryData[] = [
        {
          productId: 'prod-1',
          productName: 'Medical Supplies',
          currentStock: 50,
          minStockLevel: 20,
          maxStockLevel: 100,
          reorderPoint: 30,
          averageUsage: 10,
        },
      ]

      const result = await geminiService.predictStockNeeds(mockData)

      expect(result).toHaveLength(1)
      expect(result[0].product).toBe('Medical Supplies')
      expect(result[0].predictedNeed).toBeGreaterThan(0)
      expect(result[0].timeframe).toBe('30 days')
    })

    it('should predict with lower confidence when no usage data', async () => {
      const mockData: InventoryData[] = [
        {
          productId: 'prod-1',
          productName: 'Medical Supplies',
          currentStock: 50,
          minStockLevel: 20,
          maxStockLevel: 100,
          reorderPoint: 30,
        },
      ]

      const result = await geminiService.predictStockNeeds(mockData)

      expect(result).toHaveLength(1)
      expect(result[0].confidence).toBeLessThan(0.5)
    })
  })

  describe('generateMonthlyInsights', () => {
    it('should generate monthly insights with fallback', async () => {
      const mockData: MonthlyData = {
        month: '2024-01',
        totalItems: 100,
        totalQuantity: 5000,
        rejectCount: 50,
        topProducts: [
          { name: 'Product A', quantity: 1000 },
          { name: 'Product B', quantity: 800 },
        ],
        destinations: {
          MAIS: 3000,
          FOZAN: 2000,
        },
      }

      const result = await geminiService.generateMonthlyInsights(mockData)

      expect(result.summary).toBeDefined()
      expect(result.keyFindings).toBeInstanceOf(Array)
      expect(result.keyFindings.length).toBeGreaterThan(0)
      expect(result.trends).toBeInstanceOf(Array)
      expect(result.recommendations).toBeInstanceOf(Array)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should calculate reject rate in insights', async () => {
      const mockData: MonthlyData = {
        month: '2024-01',
        totalItems: 100,
        totalQuantity: 1000,
        rejectCount: 100,
        topProducts: [],
        destinations: {
          MAIS: 600,
          FOZAN: 400,
        },
      }

      const result = await geminiService.generateMonthlyInsights(mockData)

      expect(result.summary).toContain('10.00%')
    })
  })

  describe('askQuestion', () => {
    it('should answer questions about total inventory', async () => {
      const mockContext: InventoryContext = {
        totalItems: 100,
        totalQuantity: 5000,
        recentActivity: [
          {
            itemName: 'Medical Supplies',
            quantity: 100,
            destination: 'MAIS',
            date: '2024-01-15',
          },
        ],
      }

      const result = await geminiService.askQuestion('What is the total inventory?', mockContext)

      expect(result.question).toBeDefined()
      expect(result.answer).toBeDefined()
      expect(result.answer).toContain('100')
      expect(result.answer).toContain('5000')
    })

    it('should answer questions about low stock', async () => {
      const mockContext: InventoryContext = {
        totalItems: 100,
        totalQuantity: 5000,
        recentActivity: [],
        lowStockItems: [
          {
            itemName: 'Medical Supplies',
            currentStock: 10,
            reorderPoint: 30,
          },
        ],
      }

      const result = await geminiService.askQuestion('Which items have low stock?', mockContext)

      expect(result.answer).toContain('Medical Supplies')
    })
  })

  describe('Caching', () => {
    it('should track cache statistics', () => {
      const stats = geminiService.getCacheStats()
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('keys')
      expect(Array.isArray(stats.keys)).toBe(true)
    })

    it('should clear cache correctly', () => {
      geminiService.clearCache()
      const stats = geminiService.getCacheStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('Circuit Breaker', () => {
    it('should report circuit breaker state', () => {
      const state = geminiService.getCircuitBreakerState()
      expect(state).toBeDefined()
      expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(state)
    })
  })

  describe('Service Availability', () => {
    it('should report service availability', () => {
      const isAvailable = geminiService.isAvailable()
      expect(typeof isAvailable).toBe('boolean')
    })
  })
})
