import { prisma } from '@/services/prisma';
import { Prisma } from '@prisma/client';

/**
 * Metadata for audit log entries
 */
export interface AuditMetadata {
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Parameters for creating an audit log entry
 */
export interface CreateAuditLogParams {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, any> | null;
  metadata?: AuditMetadata;
}

/**
 * Create an audit log entry in the database
 *
 * @param params - Audit log parameters
 * @returns The created audit log record
 *
 * @example
 * ```typescript
 * await createAuditLog({
 *   userId: session.user.id,
 *   action: 'CREATE',
 *   entity: 'InventoryItem',
 *   entityId: newItem.id,
 *   changes: { newValue: { quantity: 100, location: 'Warehouse A' } },
 *   metadata: {
 *     ipAddress: request.headers.get('x-forwarded-for'),
 *     userAgent: request.headers.get('user-agent')
 *   }
 * })
 * ```
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  const { userId, action, entity, entityId, changes, metadata } = params;

  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action: action as any, // Cast to handle string to enum conversion
        entityType: entity,
        entityId,
        oldValue: changes?.oldValue
          ? (changes.oldValue as Prisma.InputJsonValue)
          : undefined,
        newValue: changes?.newValue
          ? (changes.newValue as Prisma.InputJsonValue)
          : undefined,
        ipAddress: metadata?.ipAddress || undefined,
        userAgent: metadata?.userAgent || undefined,
      },
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
    });

    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
    // But log the error for monitoring
    return null;
  }
}

/**
 * Extract request metadata from Next.js request headers
 *
 * @param request - Next.js request object
 * @returns Metadata object with IP address and user agent
 */
export function extractRequestMetadata(request: Request): AuditMetadata {
  const headers = request.headers;

  // Try to get real IP address from various headers
  const ipAddress =
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    'unknown';

  const userAgent = headers.get('user-agent') || 'unknown';

  return {
    ipAddress,
    userAgent,
  };
}

/**
 * Helper to create audit log for inventory operations
 *
 * @param userId - User performing the action
 * @param action - Action type (CREATE, UPDATE, DELETE)
 * @param inventoryItem - Inventory item data
 * @param previousData - Previous state for UPDATE operations
 * @param metadata - Request metadata
 */
export async function auditInventoryAction(
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  inventoryItem: any,
  previousData?: any,
  metadata?: AuditMetadata
) {
  const changes: Record<string, any> = {};

  if (action === 'CREATE') {
    changes.newValue = inventoryItem;
  } else if (action === 'UPDATE' && previousData) {
    changes.oldValue = previousData;
    changes.newValue = inventoryItem;
  } else if (action === 'DELETE') {
    changes.oldValue = previousData || inventoryItem;
  }

  return createAuditLog({
    userId,
    action,
    entity: 'InventoryItem',
    entityId: inventoryItem.id,
    changes,
    metadata,
  });
}

/**
 * Helper to create audit log for product operations
 *
 * @param userId - User performing the action
 * @param action - Action type (CREATE, UPDATE, DELETE)
 * @param product - Product data
 * @param previousData - Previous state for UPDATE operations
 * @param metadata - Request metadata
 */
export async function auditProductAction(
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  product: any,
  previousData?: any,
  metadata?: AuditMetadata
) {
  const changes: Record<string, any> = {};

  if (action === 'CREATE') {
    changes.new = product;
  } else if (action === 'UPDATE' && previousData) {
    changes.before = previousData;
    changes.after = product;
  } else if (action === 'DELETE') {
    changes.deleted = previousData || product;
  }

  return createAuditLog({
    userId,
    action,
    entity: 'Product',
    entityId: product.id,
    changes,
    metadata,
  });
}
