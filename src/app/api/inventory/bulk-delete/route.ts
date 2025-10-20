import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { auditInventoryAction, extractRequestMetadata } from '@/utils/audit';
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  validationError,
  handleApiError,
} from '@/utils/api-response';
import { z } from 'zod';

// Validation schema for bulk delete request
const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string())
    .min(1, 'At least one ID is required')
    .max(100, 'Maximum 100 items can be deleted at once'),
});

/**
 * POST /api/inventory/bulk-delete
 * Bulk delete inventory items (SUPERVISOR/ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return authRequiredError();
    }

    // Check role-based access: Only SUPERVISOR or ADMIN can bulk delete
    if (session.user.role !== 'SUPERVISOR' && session.user.role !== 'ADMIN') {
      return insufficientPermissionsError(
        'Only supervisors and administrators can delete inventory items'
      );
    }

    // Check permissions
    if (!session.user.permissions.includes('inventory:delete')) {
      return insufficientPermissionsError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = bulkDeleteSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        'Validation failed',
        validationResult.error.errors
      );
    }

    const { ids } = validationResult.data;

    // Fetch items to be deleted (for audit logging)
    const itemsToDelete = await prisma.inventoryItem.findMany({
      where: {
        id: { in: ids },
        deletedAt: null, // Only delete items that aren't already soft-deleted
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

    if (itemsToDelete.length === 0) {
      return validationError('No valid items found to delete');
    }

    // Track results
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Extract request metadata for audit logging
    const metadata = extractRequestMetadata(request);
    const auditLogIds: string[] = [];

    // Delete items individually for proper error handling and audit logging
    for (const item of itemsToDelete) {
      try {
        // Soft delete the item (set deletedAt timestamp)
        await prisma.inventoryItem.update({
          where: { id: item.id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Create audit log entry
        const auditLog = await auditInventoryAction(
          session.user.id,
          'DELETE',
          item,
          item, // previousData is the item itself for DELETE
          metadata
        );

        if (auditLog) {
          auditLogIds.push(auditLog.id);
        }

        results.successful++;
      } catch (error) {
        console.error(`Failed to delete item ${item.id}:`, error);
        results.failed++;
        results.errors.push(
          `Failed to delete ${item.itemName} (${item.batch}): ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return successResponse(
      {
        deletedCount: results.successful,
        failedCount: results.failed,
        errors: results.errors,
        auditLogIds,
      },
      results.failed === 0
        ? `Successfully deleted ${results.successful} item(s)`
        : `Deleted ${results.successful} item(s), ${results.failed} failed`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
