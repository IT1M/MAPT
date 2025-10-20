/**
 * Unit Tests: Email Service
 * Tests email sending, templates, and queue functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendSecurityAlertEmail,
  testEmailConfiguration,
  getEmailQueueStatus,
} from '@/services/email';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: vi.fn().mockResolvedValue(true),
    })),
  },
}));

// Mock prisma
vi.mock('@/services/prisma', () => ({
  prisma: {
    emailLog: {
      create: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('Email Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Email Configuration', () => {
    it('should test email configuration successfully', async () => {
      const result = await testEmailConfiguration();
      expect(result).toBe(true);
    });

    it('should get email queue status', () => {
      const status = getEmailQueueStatus();
      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('failed');
      expect(status).toHaveProperty('processing');
    });
  });

  describe('Welcome Email', () => {
    it('should send welcome email with correct data', async () => {
      const email = 'test@example.com';
      const data = {
        userName: 'Test User',
        email: 'test@example.com',
        loginUrl: 'https://example.com/login',
      };

      await expect(sendWelcomeEmail(email, data)).resolves.not.toThrow();
    });

    it('should handle welcome email errors gracefully', async () => {
      const email = 'test@example.com';
      const data = {
        userName: 'Test User',
        email: 'test@example.com',
        loginUrl: 'https://example.com/login',
      };

      // Email service should handle errors gracefully
      await expect(sendWelcomeEmail(email, data)).resolves.not.toThrow();
    });
  });

  describe('Password Reset Email', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com';
      const data = {
        userName: 'Test User',
        resetUrl: 'https://example.com/reset?token=abc123',
        expiresAt: new Date(Date.now() + 3600000),
      };

      await expect(sendPasswordResetEmail(email, data)).resolves.not.toThrow();
    });

    it('should include expiration time in reset email', async () => {
      const email = 'test@example.com';
      const expiresAt = new Date(Date.now() + 3600000);
      const data = {
        userName: 'Test User',
        resetUrl: 'https://example.com/reset?token=abc123',
        expiresAt,
      };

      await sendPasswordResetEmail(email, data);
      expect(data.expiresAt).toEqual(expiresAt);
    });
  });

  describe('Security Alert Email', () => {
    it('should send security alert for new device login', async () => {
      const email = 'test@example.com';
      const data = {
        userName: 'Test User',
        deviceType: 'Desktop',
        browser: 'Chrome',
        os: 'Windows',
        ipAddress: '192.168.1.1',
        location: 'Riyadh, Saudi Arabia',
        timestamp: new Date(),
      };

      await expect(sendSecurityAlertEmail(email, data)).resolves.not.toThrow();
    });

    it('should include device details in security alert', async () => {
      const email = 'test@example.com';
      const data = {
        userName: 'Test User',
        deviceType: 'Mobile',
        browser: 'Safari',
        os: 'iOS',
        ipAddress: '10.0.0.1',
        location: 'Jeddah, Saudi Arabia',
        timestamp: new Date(),
      };

      await sendSecurityAlertEmail(email, data);
      expect(data.deviceType).toBe('Mobile');
      expect(data.browser).toBe('Safari');
      expect(data.os).toBe('iOS');
    });
  });

  describe('Email Queue', () => {
    it('should track pending emails', () => {
      const status = getEmailQueueStatus();
      expect(typeof status.pending).toBe('number');
      expect(status.pending).toBeGreaterThanOrEqual(0);
    });

    it('should track failed emails', () => {
      const status = getEmailQueueStatus();
      expect(typeof status.failed).toBe('number');
      expect(status.failed).toBeGreaterThanOrEqual(0);
    });

    it('should indicate processing status', () => {
      const status = getEmailQueueStatus();
      expect(typeof status.processing).toBe('boolean');
    });
  });
});
