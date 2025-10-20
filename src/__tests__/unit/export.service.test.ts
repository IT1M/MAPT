/**
 * Unit Tests: Export Service
 * Tests export functionality for CSV, Excel, and JSON formats
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  shouldEmailExport,
} from '@/services/export';

// Mock prisma
vi.mock('@/services/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 'test-audit-id' }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock email service
vi.mock('@/services/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('Export Service Unit Tests', () => {
  const sampleData = [
    { id: '1', name: 'Item 1', quantity: 100, category: 'Medical' },
    { id: '2', name: 'Item 2', quantity: 200, category: 'Surgical' },
    { id: '3', name: 'Item 3', quantity: 150, category: 'Medical' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CSV Export', () => {
    it('should export data to CSV format', async () => {
      const buffer = await exportToCSV({
        format: 'csv',
        data: sampleData,
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const csvContent = buffer.toString('utf-8');
      expect(csvContent).toContain('id');
      expect(csvContent).toContain('name');
      expect(csvContent).toContain('Item 1');
    });

    it('should include UTF-8 BOM for Excel compatibility', async () => {
      const buffer = await exportToCSV({
        format: 'csv',
        data: sampleData,
      });

      const content = buffer.toString('utf-8');
      expect(content.charCodeAt(0)).toBe(0xfeff); // BOM character
    });

    it('should handle custom columns', async () => {
      const buffer = await exportToCSV({
        format: 'csv',
        data: sampleData,
        columns: ['name', 'quantity'],
      });

      const csvContent = buffer.toString('utf-8');
      expect(csvContent).toContain('name');
      expect(csvContent).toContain('quantity');
      expect(csvContent).not.toContain('category');
    });

    it('should throw error for empty data', async () => {
      await expect(
        exportToCSV({
          format: 'csv',
          data: [],
        })
      ).rejects.toThrow('No data to export');
    });
  });

  describe('Excel Export', () => {
    it('should export data to Excel format', async () => {
      const buffer = await exportToExcel({
        format: 'excel',
        data: sampleData,
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should include metadata in Excel export', async () => {
      const buffer = await exportToExcel({
        format: 'excel',
        data: sampleData,
        metadata: {
          title: 'Inventory Export',
          generatedBy: 'Test User',
          dateRange: '2024-01-01 to 2024-12-31',
        },
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should throw error for empty data', async () => {
      await expect(
        exportToExcel({
          format: 'excel',
          data: [],
        })
      ).rejects.toThrow('No data to export');
    });
  });

  describe('JSON Export', () => {
    it('should export data to JSON format', async () => {
      const buffer = await exportToJSON({
        format: 'json',
        data: sampleData,
      });

      expect(buffer).toBeInstanceOf(Buffer);

      const jsonContent = JSON.parse(buffer.toString('utf-8'));
      expect(jsonContent).toHaveProperty('metadata');
      expect(jsonContent).toHaveProperty('data');
      expect(jsonContent.data).toEqual(sampleData);
    });

    it('should include metadata in JSON export', async () => {
      const buffer = await exportToJSON({
        format: 'json',
        data: sampleData,
        metadata: {
          title: 'Test Export',
          generatedBy: 'Test User',
        },
      });

      const jsonContent = JSON.parse(buffer.toString('utf-8'));
      expect(jsonContent.metadata.title).toBe('Test Export');
      expect(jsonContent.metadata.generatedBy).toBe('Test User');
      expect(jsonContent.metadata).toHaveProperty('exportDate');
      expect(jsonContent.metadata).toHaveProperty('totalRecords');
    });

    it('should format JSON with proper indentation', async () => {
      const buffer = await exportToJSON({
        format: 'json',
        data: sampleData,
      });

      const jsonString = buffer.toString('utf-8');
      expect(jsonString).toContain('\n');
      expect(jsonString).toContain('  '); // 2-space indentation
    });

    it('should throw error for empty data', async () => {
      await expect(
        exportToJSON({
          format: 'json',
          data: [],
        })
      ).rejects.toThrow('No data to export');
    });
  });

  describe('Email Export Decision', () => {
    it('should recommend email for large exports', () => {
      expect(shouldEmailExport(6000)).toBe(true);
      expect(shouldEmailExport(10000)).toBe(true);
    });

    it('should not recommend email for small exports', () => {
      expect(shouldEmailExport(100)).toBe(false);
      expect(shouldEmailExport(4999)).toBe(false);
    });

    it('should use custom threshold', () => {
      expect(shouldEmailExport(1500, 1000)).toBe(true);
      expect(shouldEmailExport(500, 1000)).toBe(false);
    });

    it('should handle edge case at threshold', () => {
      expect(shouldEmailExport(5000, 5000)).toBe(false);
      expect(shouldEmailExport(5001, 5000)).toBe(true);
    });
  });

  describe('Export Options', () => {
    it('should handle filename option', async () => {
      const options = {
        format: 'csv' as const,
        data: sampleData,
        filename: 'custom-export.csv',
      };

      const buffer = await exportToCSV(options);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(options.filename).toBe('custom-export.csv');
    });

    it('should handle includeFilters option', async () => {
      const options = {
        format: 'json' as const,
        data: sampleData,
        includeFilters: true,
        metadata: {
          filters: { category: 'Medical', status: 'Active' },
        },
      };

      const buffer = await exportToJSON(options);
      const jsonContent = JSON.parse(buffer.toString('utf-8'));
      expect(jsonContent.metadata.filters).toEqual({
        category: 'Medical',
        status: 'Active',
      });
    });
  });

  describe('Data Integrity', () => {
    it('should preserve data types in JSON export', async () => {
      const dataWithTypes = [
        { id: 1, name: 'Item', active: true, price: 99.99, date: new Date() },
      ];

      const buffer = await exportToJSON({
        format: 'json',
        data: dataWithTypes,
      });

      const jsonContent = JSON.parse(buffer.toString('utf-8'));
      expect(typeof jsonContent.data[0].id).toBe('number');
      expect(typeof jsonContent.data[0].name).toBe('string');
      expect(typeof jsonContent.data[0].active).toBe('boolean');
      expect(typeof jsonContent.data[0].price).toBe('number');
    });

    it('should handle special characters in CSV', async () => {
      const dataWithSpecialChars = [
        { name: 'Item, with comma', description: 'Line 1\nLine 2' },
      ];

      const buffer = await exportToCSV({
        format: 'csv',
        data: dataWithSpecialChars,
      });

      const csvContent = buffer.toString('utf-8');
      expect(csvContent).toContain('Item, with comma');
    });

    it('should handle null and undefined values', async () => {
      const dataWithNulls = [
        { id: '1', name: 'Item', optional: null, missing: undefined },
      ];

      const buffer = await exportToJSON({
        format: 'json',
        data: dataWithNulls,
      });

      const jsonContent = JSON.parse(buffer.toString('utf-8'));
      expect(jsonContent.data[0].optional).toBeNull();
    });
  });
});
