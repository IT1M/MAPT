import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registrationSchema,
  passwordChangeSchema,
  inventoryItemSchema,
  inventoryUpdateSchema,
  batchImportRowSchema,
  exportQuerySchema,
  reportGenerationSchema,
  backupCreationSchema,
  settingsUpdateSchema,
  analyticsQuerySchema,
  aiInsightsRequestSchema,
  auditLogQuerySchema,
  inventoryQuerySchema,
} from '../validators';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('registrationSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'Password123',
        role: 'DATA_ENTRY' as const,
      };
      const result = registrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should transform email to lowercase', () => {
      const data = {
        email: 'Test@Example.COM',
        name: 'John Doe',
        password: 'Password123',
      };
      const result = registrationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should trim whitespace from name', () => {
      const data = {
        email: 'test@example.com',
        name: '  John Doe  ',
        password: 'Password123',
      };
      const result = registrationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });

    it('should reject password without uppercase', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'password123',
      };
      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'PasswordABC',
      };
      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should default role to DATA_ENTRY', () => {
      const data = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'Password123',
      };
      const result = registrationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('DATA_ENTRY');
      }
    });
  });

  describe('passwordChangeSchema', () => {
    it('should validate correct password change data', () => {
      const validData = {
        oldPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
      };
      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject new password without complexity', () => {
      const invalidData = {
        oldPassword: 'OldPassword123',
        newPassword: 'simple',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('inventoryItemSchema', () => {
    it('should validate correct inventory item', () => {
      const validData = {
        itemName: 'Medical Supplies',
        batch: 'BATCH-123',
        quantity: 100,
        reject: 5,
        destination: 'MAIS' as const,
        category: 'Surgical',
        notes: 'Test notes',
      };
      const result = inventoryItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default reject to 0', () => {
      const data = {
        itemName: 'Medical Supplies',
        batch: 'BATCH-123',
        quantity: 100,
        destination: 'MAIS' as const,
      };
      const result = inventoryItemSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reject).toBe(0);
      }
    });

    it('should reject when reject exceeds quantity', () => {
      const invalidData = {
        itemName: 'Medical Supplies',
        batch: 'BATCH-123',
        quantity: 100,
        reject: 150,
        destination: 'MAIS' as const,
      };
      const result = inventoryItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid batch format', () => {
      const invalidData = {
        itemName: 'Medical Supplies',
        batch: 'BATCH@123!',
        quantity: 100,
        destination: 'MAIS' as const,
      };
      const result = inventoryItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject quantity exceeding max', () => {
      const invalidData = {
        itemName: 'Medical Supplies',
        batch: 'BATCH-123',
        quantity: 2000000,
        destination: 'MAIS' as const,
      };
      const result = inventoryItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative quantity', () => {
      const invalidData = {
        itemName: 'Medical Supplies',
        batch: 'BATCH-123',
        quantity: -10,
        destination: 'MAIS' as const,
      };
      const result = inventoryItemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('inventoryUpdateSchema', () => {
    it('should validate partial update', () => {
      const validData = {
        quantity: 150,
        notes: 'Updated notes',
      };
      const result = inventoryUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const result = inventoryUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('batchImportRowSchema', () => {
    it('should validate correct batch import row', () => {
      const validData = {
        itemName: 'Medical Supplies',
        batch: 'BATCH-123',
        quantity: 100,
        reject: 5,
        destination: 'FOZAN' as const,
      };
      const result = batchImportRowSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default reject to 0 when not provided', () => {
      const data = {
        itemName: 'Medical Supplies',
        batch: 'BATCH-123',
        quantity: 100,
        destination: 'FOZAN' as const,
      };
      const result = batchImportRowSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reject).toBe(0);
      }
    });
  });

  describe('exportQuerySchema', () => {
    it('should validate correct export query', () => {
      const validData = {
        format: 'csv' as const,
        search: 'medical',
        destination: 'MAIS' as const,
      };
      const result = exportQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid format', () => {
      const invalidData = {
        format: 'pdf',
      };
      const result = exportQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate datetime strings', () => {
      const validData = {
        format: 'json' as const,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.999Z',
      };
      const result = exportQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('reportGenerationSchema', () => {
    it('should validate correct report generation data', () => {
      const validData = {
        type: 'MONTHLY' as const,
        periodStart: '2024-01-01T00:00:00.000Z',
        periodEnd: '2024-01-31T23:59:59.999Z',
        includeCharts: true,
        includeAiInsights: false,
      };
      const result = reportGenerationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default includeCharts to true', () => {
      const data = {
        type: 'YEARLY' as const,
        periodStart: '2024-01-01T00:00:00.000Z',
        periodEnd: '2024-12-31T23:59:59.999Z',
      };
      const result = reportGenerationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeCharts).toBe(true);
      }
    });

    it('should reject when end date is before start date', () => {
      const invalidData = {
        type: 'CUSTOM' as const,
        periodStart: '2024-12-31T23:59:59.999Z',
        periodEnd: '2024-01-01T00:00:00.000Z',
      };
      const result = reportGenerationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('backupCreationSchema', () => {
    it('should validate correct backup creation data', () => {
      const validData = {
        fileType: 'JSON' as const,
        includeAudit: true,
      };
      const result = backupCreationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default includeAudit to false', () => {
      const data = {
        fileType: 'CSV' as const,
      };
      const result = backupCreationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeAudit).toBe(false);
      }
    });
  });

  describe('settingsUpdateSchema', () => {
    it('should validate correct settings update', () => {
      const validData = {
        settings: [
          { key: 'theme', value: 'dark' },
          { key: 'language', value: 'en' },
        ],
      };
      const result = settingsUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty settings array', () => {
      const invalidData = {
        settings: [],
      };
      const result = settingsUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('analyticsQuerySchema', () => {
    it('should validate correct analytics query', () => {
      const validData = {
        period: '30d' as const,
        groupBy: 'week' as const,
      };
      const result = analyticsQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default period to 30d', () => {
      const data = {};
      const result = analyticsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.period).toBe('30d');
      }
    });

    it('should default groupBy to day', () => {
      const data = {};
      const result = analyticsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groupBy).toBe('day');
      }
    });
  });

  describe('aiInsightsRequestSchema', () => {
    it('should validate correct AI insights request', () => {
      const validData = {
        dataType: 'inventory' as const,
        period: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.999Z',
        },
      };
      const result = aiInsightsRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject when end date is before start date', () => {
      const invalidData = {
        dataType: 'trends' as const,
        period: {
          startDate: '2024-12-31T23:59:59.999Z',
          endDate: '2024-01-01T00:00:00.000Z',
        },
      };
      const result = aiInsightsRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('auditLogQuerySchema', () => {
    it('should validate correct audit log query', () => {
      const validData = {
        action: 'CREATE' as const,
        page: 1,
        limit: 50,
      };
      const result = auditLogQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default page to 1', () => {
      const data = {};
      const result = auditLogQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it('should default limit to 50', () => {
      const data = {};
      const result = auditLogQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject limit exceeding 200', () => {
      const invalidData = {
        limit: 300,
      };
      const result = auditLogQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('inventoryQuerySchema', () => {
    it('should validate correct inventory query', () => {
      const validData = {
        page: 2,
        limit: 100,
        search: 'medical',
        destination: 'MAIS' as const,
        sortBy: 'itemName',
        sortOrder: 'asc' as const,
      };
      const result = inventoryQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const data = {};
      const result = inventoryQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(50);
        expect(result.data.sortBy).toBe('createdAt');
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should reject limit exceeding 200', () => {
      const invalidData = {
        limit: 250,
      };
      const result = inventoryQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
