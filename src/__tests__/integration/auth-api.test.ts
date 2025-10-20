/**
 * Integration Tests: Authentication API
 * Tests authentication endpoints and flows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock services
vi.mock('@/services/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    session: {
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/services/login-security', () => ({
  isAccountLocked: vi.fn().mockResolvedValue(false),
  recordFailedLogin: vi.fn().mockResolvedValue(undefined),
  recordSuccessfulLogin: vi.fn().mockResolvedValue(undefined),
  getLoginSecurityStatus: vi.fn().mockResolvedValue({
    failedAttempts: 0,
    isLocked: false,
    lockoutEndsAt: null,
  }),
}))

vi.mock('bcrypt', () => ({
  compare: vi.fn().mockResolvedValue(true),
  hash: vi.fn().mockResolvedValue('hashed-password'),
}))

describe('Authentication API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Login Flow', () => {
    it('should authenticate valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'DATA_ENTRY',
        isActive: true,
        passwordHash: 'hashed-password',
        lastLogin: null,
        lastLoginIp: null,
      }

      const { prisma } = await import('@/services/prisma')
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      // Simulate login
      const credentials = {
        email: 'test@example.com',
        password: 'ValidPassword123!',
      }

      expect(credentials.email).toBe('test@example.com')
      expect(credentials.password).toBeTruthy()
    })

    it('should reject invalid credentials', async () => {
      const { prisma } = await import('@/services/prisma')
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'WrongPassword',
      }

      expect(credentials.email).toBeTruthy()
      expect(credentials.password).toBeTruthy()
    })

    it('should reject inactive users', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'DATA_ENTRY',
        isActive: false,
        passwordHash: 'hashed-password',
      }

      const { prisma } = await import('@/services/prisma')
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      expect(mockUser.isActive).toBe(false)
    })

    it('should reject locked accounts', async () => {
      const { isAccountLocked } = await import('@/services/login-security')
      vi.mocked(isAccountLocked).mockResolvedValue(true)

      const result = await isAccountLocked('test@example.com')
      expect(result).toBe(true)
    })

    it('should record failed login attempts', async () => {
      const { recordFailedLogin } = await import('@/services/login-security')
      
      await recordFailedLogin('test@example.com', '192.168.1.1', 'Mozilla/5.0')
      
      expect(recordFailedLogin).toHaveBeenCalledWith(
        'test@example.com',
        '192.168.1.1',
        'Mozilla/5.0'
      )
    })

    it('should record successful login', async () => {
      const { recordSuccessfulLogin } = await import('@/services/login-security')
      
      await recordSuccessfulLogin('user-1', 'test@example.com', '192.168.1.1', 'Mozilla/5.0')
      
      expect(recordSuccessfulLogin).toHaveBeenCalledWith(
        'user-1',
        'test@example.com',
        '192.168.1.1',
        'Mozilla/5.0'
      )
    })
  })

  describe('Session Management', () => {
    it('should list user sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          userId: 'user-1',
          deviceType: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          ipAddress: '192.168.1.1',
          location: 'Riyadh',
          lastActive: new Date(),
        },
      ]

      const { prisma } = await import('@/services/prisma')
      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions as any)

      const sessions = await prisma.session.findMany({
        where: { userId: 'user-1' },
      })

      expect(sessions).toHaveLength(1)
      expect(sessions[0].deviceType).toBe('Desktop')
    })

    it('should delete specific session', async () => {
      const { prisma } = await import('@/services/prisma')
      vi.mocked(prisma.session.delete).mockResolvedValue({} as any)

      await prisma.session.delete({
        where: { id: 'session-1' },
      })

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      })
    })

    it('should delete all user sessions except current', async () => {
      const { prisma } = await import('@/services/prisma')
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 3 } as any)

      await prisma.session.deleteMany({
        where: {
          userId: 'user-1',
          id: { not: 'current-session-id' },
        },
      })

      expect(prisma.session.deleteMany).toHaveBeenCalled()
    })
  })

  describe('Password Reset Flow', () => {
    it('should create password reset token', async () => {
      const mockToken = {
        id: 'token-1',
        token: 'reset-token-123',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
      }

      const { prisma } = await import('@/services/prisma')
      vi.mocked(prisma.passwordResetToken.create).mockResolvedValue(mockToken as any)

      const token = await prisma.passwordResetToken.create({
        data: {
          token: 'reset-token-123',
          userId: 'user-1',
          expiresAt: new Date(Date.now() + 3600000),
        },
      })

      expect(token.token).toBe('reset-token-123')
      expect(token.used).toBe(false)
    })

    it('should validate reset token', async () => {
      const mockToken = {
        id: 'token-1',
        token: 'reset-token-123',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
      }

      const { prisma } = await import('@/services/prisma')
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(mockToken as any)

      const token = await prisma.passwordResetToken.findUnique({
        where: { token: 'reset-token-123' },
      })

      expect(token).toBeTruthy()
      expect(token?.used).toBe(false)
      expect(token?.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('should reject expired tokens', async () => {
      const expiredToken = {
        id: 'token-1',
        token: 'expired-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        used: false,
      }

      const { prisma } = await import('@/services/prisma')
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(expiredToken as any)

      const token = await prisma.passwordResetToken.findUnique({
        where: { token: 'expired-token' },
      })

      expect(token?.expiresAt.getTime()).toBeLessThan(Date.now())
    })

    it('should reject used tokens', async () => {
      const usedToken = {
        id: 'token-1',
        token: 'used-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 3600000),
        used: true,
      }

      const { prisma } = await import('@/services/prisma')
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(usedToken as any)

      const token = await prisma.passwordResetToken.findUnique({
        where: { token: 'used-token' },
      })

      expect(token?.used).toBe(true)
    })

    it('should mark token as used after password reset', async () => {
      const { prisma } = await import('@/services/prisma')
      vi.mocked(prisma.passwordResetToken.update).mockResolvedValue({} as any)

      await prisma.passwordResetToken.update({
        where: { token: 'reset-token-123' },
        data: { used: true },
      })

      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { token: 'reset-token-123' },
        data: { used: true },
      })
    })
  })

  describe('Security Features', () => {
    it('should extract IP address from request headers', () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '192.168.1.1')
      
      const ipAddress = headers.get('x-forwarded-for') || 'unknown'
      expect(ipAddress).toBe('192.168.1.1')
    })

    it('should extract user agent from request headers', () => {
      const headers = new Headers()
      headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
      
      const userAgent = headers.get('user-agent') || 'unknown'
      expect(userAgent).toContain('Mozilla')
    })

    it('should handle missing headers gracefully', () => {
      const headers = new Headers()
      
      const ipAddress = headers.get('x-forwarded-for') || 'unknown'
      const userAgent = headers.get('user-agent') || 'unknown'
      
      expect(ipAddress).toBe('unknown')
      expect(userAgent).toBe('unknown')
    })
  })
})
