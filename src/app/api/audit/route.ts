import { NextRequest } from 'next/server';
import { prisma } from '@/services/prisma';
import { AuditAction } from '@prisma/client';
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  handleApiError,
} from '@/utils/api-response';
import {
  calculatePagination,
  calculateSkip,
  normalizePagination,
} from '@/utils/pagination';
import { auth } from '@/services/auth';

/**
 * GET /api/audit/logs
 * List audit logs with filters and pagination
 * Requires AUDITOR role or higher
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return authRequiredError();
    }

    // Check role - AUDITOR or higher required
    const allowedRoles = ['AUDITOR', 'MANAGER', 'ADMIN'];
    if (!allowedRoles.includes(session.user.role)) {
      return insufficientPermissionsError('AUDITOR role or higher required');
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const action = searchParams.get('action') as AuditAction | null;
    const entityType = searchParams.get('entityType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Pagination parameters
    const rawPage = parseInt(searchParams.get('page') || '1');
    const rawLimit = parseInt(searchParams.get('limit') || '50');
    const { page, limit } = normalizePagination(rawPage, rawLimit, 200);

    // Build Prisma where clause with filters
    const where: any = {};

    // Filter by userId
    if (userId) {
      where.userId = userId;
    }

    // Filter by action type
    if (action) {
      where.action = action;
    }

    // Filter by entityType
    if (entityType) {
      where.entityType = entityType;
    }

    // Date range filters
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Query audit logs with user details included
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: calculateSkip(page, limit),
      take: limit,
    });

    // Calculate pagination metadata
    const pagination = calculatePagination(total, page, limit);

    return successResponse({
      logs,
      pagination,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
