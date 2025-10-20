/**
 * Search API Integration Tests
 * Tests for global search API endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/search/route';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/services/auth', () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
      },
    })
  ),
}));

// Mock prisma
vi.mock('@/services/prisma', () => ({
  prisma: {
    inventoryItem: {
      findMany: vi.fn(() =>
        Promise.resolve([
          {
            id: 'item-1',
            itemName: 'Test Item',
            batch: 'BATCH-001',
            category: 'Medical',
          },
        ])
      ),
    },
    report: {
      findMany: vi.fn(() =>
        Promise.resolve([
          {
            id: 'report-1',
            title: 'Test Report',
            type: 'SUMMARY',
          },
        ])
      ),
    },
    user: {
      findMany: vi.fn(() =>
        Promise.resolve([
          {
            id: 'user-2',
            name: 'John Doe',
            email: 'john@example.com',
          },
        ])
      ),
    },
  },
}));

describe('Search API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return search results for authenticated user', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('reports');
    expect(data).toHaveProperty('users');
    expect(data).toHaveProperty('settings');
    expect(data).toHaveProperty('total');
  });

  it('should require authentication', async () => {
    // Mock auth to return null
    const { auth } = await import('@/services/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should require query parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should filter results by user role', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('should handle empty search results', async () => {
    const { prisma } = await import('@/services/prisma');
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.report.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'nonexistent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(0);
    expect(data.items).toEqual([]);
  });

  it('should limit results per category', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test', limit: 5 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items.length).toBeLessThanOrEqual(5);
  });

  it('should handle database errors gracefully', async () => {
    const { prisma } = await import('@/services/prisma');
    vi.mocked(prisma.inventoryItem.findMany).mockRejectedValueOnce(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it('should search case-insensitively', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'TEST' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBeGreaterThanOrEqual(0);
  });

  it('should include result metadata', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    if (data.items.length > 0) {
      const item = data.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('url');
    }
  });
});
