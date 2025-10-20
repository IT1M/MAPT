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
import { Destination } from '@prisma/client';

// Validation schema for bulk edit request
const bulkEditSchema = z.object({
  ids: z
    .array(z.string())
    .min(1, 'At least one ID is required')
    .max(100, 'Maximum 100 items can be updated at once'),
  updates: z
    .object({
      destination: z.nativeEnum(Destination).optional(),
      category: z.string().optional(),
      notes: z.string().optional(),
      notesMode: z.enum(['replace', 'append']).optional(),
    })
    .refine(
      (data) =>
        data.destination !== undefined ||
        data.category !== undefined ||
        data.notes !== undefined,
      { message: 'At least one field must be provided for update' }
    ),
});

/**
 * POST /api/inventory/bulk-edit
 * Bulk edit inventory items with support for multiple fields and modes
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
    const validationResult = bulkEditSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        'Validation failed',
        validationResult.error.errors
      );
    }

    const { ids, updates } = validationResult.data;

    // Fetch items to be updated (for audit logging and validation)
    const itemsToUpdate = await prisma.inventoryItem.findMany({
      where: {
        id: { in: ids },
        deletedAt: null, // Only update items that aren't soft-deleted
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

    if (itemsToUpdate.length === 0) {
      return validationError('No valid items found to update');
    }

    // Role-based filtering: DATA_ENTRY users can only update their own items
    let itemsUserCanUpdate = itemsToUpdate;
    if (session.user.role === 'DATA_ENTRY') {
      itemsUserCanUpdate = itemsToUpdate.filter(
        (item) => item.enteredById === session.user.id
      );

      if (itemsUserCanUpdate.length === 0) {
        return insufficientPermissionsError(
          'You can only update items you created'
        );
      }

      if (itemsUserCanUpdate.length < itemsToUpdate.length) {
        return insufficientPermissionsError(
          `You can only update ${itemsUserCanUpdate.length} of the ${itemsToUpdate.length} selected items (items you created)`
        );
      }
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

    // Update items individually to handle notes append mode and proper audit logging
    for (const item of itemsUserCanUpdate) {
      try {
        // Prepare update data
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.destination !== undefined) {
          updateData.destination = updates.destination;
        }

        if (updates.category !== undefined) {
          updateData.category = updates.category;
        }

        if (updates.notes !== undefined) {
          if (updates.notesMode === 'append' && item.notes) {
            // Append to existing notes
            updateData.notes = `${item.notes}\n${updates.notes}`;
          } else {
            // Replace notes
            updateData.notes = updates.notes;
          }
        }

        // Store previous state for audit
        const previousItem = { ...item };

        // Update the item
        const updatedItem = await prisma.inventoryItem.update({
          where: { id: item.id },
          data: updateData,
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

        // Create audit log entry
        const auditLog = await auditInventoryAction(
          session.user.id,
          'UPDATE',
          updatedItem,
          previousItem,
          metadata
        );

        if (auditLog) {
          auditLogIds.push(auditLog.id);
        }

        results.successful++;
      } catch (error) {
        console.error(`Failed to update item ${item.id}:`, error);
        results.failed++;
        results.errors.push(
          `Failed to update ${item.itemName} (${item.batch}): ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Return success response with detailed results
    return successResponse(
      {
        updatedCount: results.successful,
        failedCount: results.failed,
        errors: results.errors,
        auditLogIds,
      },
      results.failed === 0
        ? `Successfully updated ${results.successful} item(s)`
        : `Updated ${results.successful} item(s), ${results.failed} failed`,
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
