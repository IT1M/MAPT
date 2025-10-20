import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../register/route';
import { NextRequest } from 'next/server';
import * as bcrypt from 'bcrypt';

// Mock dependencies
vi.mock('@/services/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
}));

import { prisma } from '@/services/prisma';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'John Doe',
      role: 'DATA_ENTRY',
      isActive: true,
      createdAt: new Date(),
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'John Doe',
        password: 'Password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('test@example.com');
    expect(data.data.name).toBe('John Doe');
    expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 12);
  });

  it('should reject duplicate email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'existing-user',
      email: 'test@example.com',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'John Doe',
        password: 'Password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('already exists');
  });

  it('should reject invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        name: 'John Doe',
        password: 'Password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should reject weak password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'John Doe',
        password: 'weak',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should sanitize and transform input', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'John Doe',
      role: 'DATA_ENTRY',
      isActive: true,
      createdAt: new Date(),
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'Test@Example.COM',
        name: '  John Doe  ',
        password: 'Password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.email).toBe('test@example.com');
    expect(data.data.name).toBe('John Doe');
  });

  it('should create audit log entry', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'John Doe',
      role: 'DATA_ENTRY',
      isActive: true,
      createdAt: new Date(),
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'John Doe',
        password: 'Password123',
      }),
    });

    await POST(request);

    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});
