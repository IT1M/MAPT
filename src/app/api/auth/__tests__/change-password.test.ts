import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../change-password/route'
import { NextRequest } from 'next/server'
import * as bcrypt from 'bcrypt'

// Mock dependencies
vi.mock('@/services/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/services/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}))

import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'

describe('POST /api/auth/change-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should change password successfully', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
      },
    }

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'John Doe',
      passwordHash: 'old-hashed-password',
    }

    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(bcrypt.hash).mockResolvedValue('new-hashed-password' as never)
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword123', 'old-hashed-password')
    expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword456', 12)
    expect(prisma.user.update).toHaveBeenCalledTimes(2)
  })

  it('should reject unauthenticated request', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('should reject incorrect old password', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    }

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'John Doe',
      passwordHash: 'old-hashed-password',
    }

    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword: 'WrongPassword123',
        newPassword: 'NewPassword456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('incorrect')
  })

  it('should reject weak new password', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    }

    vi.mocked(auth).mockResolvedValue(mockSession as any)

    const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword: 'OldPassword123',
        newPassword: 'weak',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should create audit log entry', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    }

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'John Doe',
      passwordHash: 'old-hashed-password',
    }

    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(bcrypt.hash).mockResolvedValue('new-hashed-password' as never)
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
      }),
    })

    await POST(request)

    expect(prisma.auditLog.create).toHaveBeenCalled()
  })
})
