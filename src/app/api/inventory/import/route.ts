import { NextRequest } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { batchImportRowSchema } from '@/utils/validators';
import { sanitizeString } from '@/utils/sanitize';
import { createAuditLog, extractRequestMetadata } from '@/utils/audit';
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  validationError,
  handleApiError,
} from '@/utils/api-response';
import type {
  ImportOptions,
  ValidationError,
  ImportResult,
} from '@/types/import';

/**
 * POST /api/inventory/import
 * Import inventory items with advanced validation and options
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

    // Parse form data
    const formData = await request.formData();
    const dataBlob = formData.get('data') as Blob | null;
    const optionsStr = formData.get('options') as string | null;

    if (!dataBlob) {
      return validationError('No data provided');
    }

    // Parse data and options
    const dataText = await dataBlob.text();
    const rows = JSON.parse(dataText);
    const options: ImportOptions = optionsStr
      ? JSON.parse(optionsStr)
      : { duplicateHandling: 'skip' };

    if (!Array.isArray(rows) || rows.length === 0) {
      return validationError('No rows to import');
    }

    if (rows.length > 10000) {
      return validationError(
        'Maximum 10,000 items per import. Please split your file.'
      );
    }

    // Validate and process rows
    const validItems: any[] = [];
    const errors: ValidationError[] = [];
    const duplicates: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is header

      // Convert string numbers to actual numbers
      const processedRow = {
        itemName: row.itemName,
        batch: row.batch,
        quantity: parseInt(String(row.quantity)),
        reject: parseInt(String(row.reject || '0')),
        destination: row.destination,
        category: row.category,
        notes: row.notes,
      };

      // Validate with Zod schema
      const validationResult = batchImportRowSchema.safeParse(processedRow);

      if (!validationResult.success) {
        // Collect validation errors
        validationResult.error.errors.forEach((err) => {
          errors.push({
            row: rowNumber,
            field: err.path[0] as string,
            value: processedRow[err.path[0] as keyof typeof processedRow],
            error: err.message,
          });
        });
      } else {
        // Check for duplicates if needed
        if (options.duplicateHandling !== 'create') {
          const existing = await prisma.inventoryItem.findFirst({
            where: {
              itemName: validationResult.data.itemName,
              batch: validationResult.data.batch,
              deletedAt: null,
            },
          });

          if (existing) {
            if (options.duplicateHandling === 'skip') {
              duplicates.push(
                `${validationResult.data.itemName} - ${validationResult.data.batch}`
              );
              continue;
            } else if (options.duplicateHandling === 'update') {
              // Add to update list
              validItems.push({
                ...validationResult.data,
                _action: 'update',
                _id: existing.id,
              });
              continue;
            }
          }
        }

        validItems.push(validationResult.data);
      }
    }

    // Perform import in transaction
    let successCount = 0;
    let failedCount = 0;
    const importErrors: ValidationError[] = [];

    if (validItems.length > 0) {
      try {
        await prisma.$transaction(async (tx) => {
          for (const item of validItems) {
            try {
              if (item._action === 'update') {
                // Update existing item
                await tx.inventoryItem.update({
                  where: { id: item._id },
                  data: {
                    quantity: item.quantity,
                    reject: item.reject,
                    destination: item.destination,
                    category: item.category
                      ? sanitizeString(item.category)
                      : undefined,
                    notes: item.notes ? sanitizeString(item.notes) : undefined,
                    updatedAt: new Date(),
                  },
                });
              } else {
                // Create new item
                const createData: any = {
                  itemName: sanitizeString(item.itemName),
                  batch: sanitizeString(item.batch),
                  quantity: item.quantity,
                  reject: item.reject,
                  destination: item.destination,
                  enteredById: session.user.id,
                };

                if (item.category) {
                  createData.category = sanitizeString(item.category);
                }

                if (item.notes) {
                  createData.notes = sanitizeString(item.notes);
                }

                await tx.inventoryItem.create({
                  data: createData,
                });
              }
              successCount++;
            } catch (error: any) {
              failedCount++;
              importErrors.push({
                row: 0,
                field: 'general',
                value: item.itemName,
                error: error.message || 'Failed to import item',
              });
            }
          }
        });
      } catch (error: any) {
        // Transaction failed
        return handleApiError(error);
      }
    }

    // Create audit log
    const metadata = extractRequestMetadata(request);
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      entity: 'InventoryItem',
      entityId: 'bulk-import',
      changes: {
        successCount,
        failedCount,
        errorCount: errors.length,
        duplicateCount: duplicates.length,
        totalRows: rows.length,
        options,
      },
      metadata,
    });

    // Create import log file (optional - for audit trail)
    const importLogId = `import-${Date.now()}`;

    const result: ImportResult = {
      successCount,
      failedCount: failedCount + errors.length,
      errors: [...errors, ...importErrors].slice(0, 100), // Limit to first 100 errors
      importLogId,
    };

    return successResponse(
      result,
      `Successfully imported ${successCount} items. ${failedCount + errors.length} items failed.`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
