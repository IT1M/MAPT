import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { inventoryItemSchema } from '@/utils/validators';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';
import { auditInventoryAction, extractRequestMetadata } from '@/utils/audit';
import { sanitizeString, sanitizeObject } from '@/utils/sanitize';
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  validationError,
  notFoundError,
  handleApiError,
} from '@/utils/api-response';

/**
 * GET /api/inventory
 * List inventory items with pagination, search, and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return authRequiredError();
    }

    // Check permissions
    if (!session.user.permissions.includes('inventory:read')) {
      return insufficientPermissionsError();
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE)),
      200
    );
    const search = searchParams.get('search');
    const destination = searchParams.get('destination') as
      | 'MAIS'
      | 'FOZAN'
      | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as
      | 'asc'
      | 'desc';

    // Build where clause
    const where: any = {};

    // Exclude soft-deleted items
    where.deletedAt = null;

    // Search in itemName and batch
    if (search) {
      where.OR = [
        {
          itemName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          batch: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Filter by destination
    if (destination) {
      where.destination = destination;
    }

    // Date range filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Role-based filtering: DATA_ENTRY users only see their own items
    if (session.user.role === 'DATA_ENTRY') {
      where.enteredById = session.user.id;
    }

    // Get total count
    const total = await prisma.inventoryItem.count({ where });

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get paginated items with user details
    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        enteredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return successResponse({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/inventory
 * Create a new inventory item
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return authRequiredError();
    }

    // Check permissions
    if (!session.user.permissions.includes('inventory:write')) {
      return insufficientPermissionsError();
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate with Zod schema
    const validationResult = inventoryItemSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        'Validation failed',
        validationResult.error.errors
      );
    }

    const data = validationResult.data;

    // Sanitize string inputs
    const sanitizedData = {
      itemName: sanitizeString(data.itemName),
      batch: sanitizeString(data.batch),
      quantity: data.quantity,
      reject: data.reject,
      destination: data.destination,
      category: data.category ? sanitizeString(data.category) : undefined,
      notes: data.notes ? sanitizeString(data.notes) : undefined,
    };

    // Create inventory item with auto-assigned enteredById
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        ...sanitizedData,
        enteredById: session.user.id,
      },
      include: {
        enteredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log with action=CREATE
    const metadata = extractRequestMetadata(request);
    await auditInventoryAction(
      session.user.id,
      'CREATE',
      inventoryItem,
      undefined,
      metadata
    );

    return successResponse(
      inventoryItem,
      'Inventory item created successfully',
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
