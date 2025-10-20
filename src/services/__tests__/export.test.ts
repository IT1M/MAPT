/**
 * Export Service Tests
 * Tests for data export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  shouldEmailExport,
} from '../export';

describe('Export Service', () => {
  const sampleData = [
    { id: '1', name: 'Item 1', quantity: 10, price: 100 },
    { id: '2', name: 'Item 2', quantity: 20, price: 200 },
    { id: '3', name: 'Item 3', quantity: 30, price: 300 },
  ];

  describe('exportToCSV', () => {
    it('should export data to CSV format', async () => {
      const buffer = await exportToCSV({
        format: 'csv',
        data: sampleData,
      });

      expect(buffer).toBeInstanceOf(Buffer);
      const csvContent = buffer.toString('utf-8');
      expect(csvContent).toContain('id,name,quantity,price');
      expect(csvContent).toContain('Item 1');
      expect(csvContent).toContain('Item 2');
    });

    it('should include UTF-8 BOM for Excel compatibility', async () => {
      const buffer = await exportToCSV({
        format: 'csv',
        data: sampleData,
      });

      const content = buffer.toString('utf-8');
      expect(content.charCodeAt(0)).toBe(0xfeff);
    });

    it('should respect column selection', async () => {
      const buffer = await exportToCSV({
        format: 'csv',
        data: sampleData,
        columns: ['name', 'quantity'],
      });

      const csvContent = buffer.toString('utf-8');
      expect(csvContent).toContain('name,quantity');
      expect(csvContent).not.toContain('price');
    });

    it('should throw error for empty data', async () => {
      await expect(
        exportToCSV({
          format: 'csv',
          data: [],
        })
      ).rejects.toThrow('No data to export');
    });

    it('should handle special characters', async () => {
      const specialData = [
        { name: 'Item, with comma', description: 'Line\nbreak' },
      ];

      const buffer = await exportToCSV({
        format: 'csv',
        data: specialData,
      });

      const csvContent = buffer.toString('utf-8');
      expect(csvContent).toContain('"Item, with comma"');
    });
  });

  describe('exportToExcel', () => {
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
          title: 'Test Export',
          generatedBy: 'Test User',
          dateRange: '2024-01-01 to 2024-01-31',
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

    it('should handle large datasets', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `Item ${i}`,
        value: i * 10,
      }));

      const buffer = await exportToExcel({
        format: 'excel',
        data: largeData,
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('exportToJSON', () => {
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

    it('should include record count in metadata', async () => {
      const buffer = await exportToJSON({
        format: 'json',
        data: sampleData,
      });

      const jsonContent = JSON.parse(buffer.toString('utf-8'));
      expect(jsonContent.metadata.totalRecords).toBe(sampleData.length);
    });

    it('should throw error for empty data', async () => {
      await expect(
        exportToJSON({
          format: 'json',
          data: [],
        })
      ).rejects.toThrow('No data to export');
    });

    it('should format JSON with indentation', async () => {
      const buffer = await exportToJSON({
        format: 'json',
        data: sampleData,
      });

      const jsonString = buffer.toString('utf-8');
      expect(jsonString).toContain('\n');
      expect(jsonString).toContain('  ');
    });
  });

  describe('shouldEmailExport', () => {
    it('should return false for small exports', () => {
      expect(shouldEmailExport(100)).toBe(false);
      expect(shouldEmailExport(1000)).toBe(false);
      expect(shouldEmailExport(4999)).toBe(false);
    });

    it('should return true for large exports', () => {
      expect(shouldEmailExport(5001)).toBe(true);
      expect(shouldEmailExport(10000)).toBe(true);
      expect(shouldEmailExport(50000)).toBe(true);
    });

    it('should respect custom threshold', () => {
      expect(shouldEmailExport(100, 50)).toBe(true);
      expect(shouldEmailExport(100, 200)).toBe(false);
    });

    it('should handle edge case at threshold', () => {
      expect(shouldEmailExport(5000)).toBe(false);
      expect(shouldEmailExport(5001)).toBe(true);
    });
  });

  describe('Export Options', () => {
    it('should handle custom filename', async () => {
      const options = {
        format: 'csv' as const,
        data: sampleData,
        filename: 'custom-export.csv',
      };

      const buffer = await exportToCSV(options);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle filter metadata', async () => {
      const options = {
        format: 'json' as const,
        data: sampleData,
        metadata: {
          filters: {
            category: 'Medical',
            dateRange: '2024-01-01 to 2024-01-31',
          },
        },
      };

      const buffer = await exportToJSON(options);
      const jsonContent = JSON.parse(buffer.toString('utf-8'));
      expect(jsonContent.metadata.filters).toEqual(options.metadata.filters);
    });
  });

  describe('Data Validation', () => {
    it('should handle null values', async () => {
      const dataWithNulls = [
        { id: '1', name: 'Item 1', value: null },
        { id: '2', name: null, value: 100 },
      ];

      const buffer = await exportToCSV({
        format: 'csv',
        data: dataWithNulls,
      });

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle undefined values', async () => {
      const dataWithUndefined = [
        { id: '1', name: 'Item 1', value: undefined },
        { id: '2', name: undefined, value: 100 },
      ];

      const buffer = await exportToCSV({
        format: 'csv',
        data: dataWithUndefined,
      });

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle nested objects in JSON export', async () => {
      const nestedData = [
        {
          id: '1',
          name: 'Item 1',
          details: { category: 'A', subcategory: 'A1' },
        },
      ];

      const buffer = await exportToJSON({
        format: 'json',
        data: nestedData,
      });

      const jsonContent = JSON.parse(buffer.toString('utf-8'));
      expect(jsonContent.data[0].details).toEqual(nestedData[0].details);
    });
  });
});
