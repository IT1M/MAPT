import { NextRequest } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { batchImportRowSchema } from '@/utils/validators'
import { sanitizeString } from '@/utils/sanitize'
import { createAuditLog, extractRequestMetadata } from '@/utils/audit'
import {
  successResponse,
  authRequiredError,
  insufficientPermissionsError,
  validationError,
  handleApiError,
} from '@/utils/api-response'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface ImportError {
  row: number
  field: string
  message: string
}

/**
 * POST /api/inventory/batch-import
 * Import multiple inventory items from CSV or Excel file
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return authRequiredError()
    }

    // Check permissions
    if (!session.user.permissions.includes('inventory:write')) {
      return insufficientPermissionsError()
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return validationError('No file provided')
    }

    // Check file type
    const fileName = file.name.toLowerCase()
    const isCsv = fileName.endsWith('.csv')
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

    if (!isCsv && !isExcel) {
      return validationError('Invalid file type. Only CSV and Excel files are supported')
    }

    // Read file content
    const fileBuffer = await file.arrayBuffer()
    const fileContent = Buffer.from(fileBuffer)

    let rows: any[] = []

    // Parse file based on type
    if (isCsv) {
      const csvText = fileContent.toString('utf-8')
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      })
      rows = parseResult.data
    } else if (isExcel) {
      const workbook = XLSX.read(fileContent, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json(worksheet)
    }

    // Validate row count
    if (rows.length === 0) {
      return validationError('File is empty')
    }

    if (rows.length > 1000) {
      return validationError('Maximum 1000 items per import. Please split your file.')
    }

    // Validate and collect errors
    const validItems: any[] = []
    const errors: ImportError[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 because row 1 is header and arrays are 0-indexed

      // Convert string numbers to actual numbers
      const processedRow = {
        itemName: row.itemName || row.ItemName || row.item_name,
        batch: row.batch || row.Batch,
        quantity: parseInt(row.quantity || row.Quantity),
        reject: parseInt(row.reject || row.Reject || '0'),
        destination: row.destination || row.Destination,
        category: row.category || row.Category,
        notes: row.notes || row.Notes,
      }

      // Validate with Zod schema
      const validationResult = batchImportRowSchema.safeParse(processedRow)

      if (!validationResult.success) {
        // Collect all validation errors for this row
        validationResult.error.errors.forEach((err) => {
          errors.push({
            row: rowNumber,
            field: err.path.join('.'),
            message: err.message,
          })
        })
      } else {
        validItems.push(validationResult.data)
      }
    }

    // Create valid items in transaction
    let successCount = 0
    if (validItems.length > 0) {
      const itemsToCreate = validItems.map((item) => ({
        itemName: sanitizeString(item.itemName),
        batch: sanitizeString(item.batch),
        quantity: item.quantity,
        reject: item.reject,
        destination: item.destination,
        category: item.category ? sanitizeString(item.category) : undefined,
        notes: item.notes ? sanitizeString(item.notes) : undefined,
        enteredById: session.user.id,
      }))

      await prisma.$transaction(async (tx) => {
        for (const item of itemsToCreate) {
          await tx.inventoryItem.create({
            data: item,
          })
          successCount++
        }
      })
    }

    // Create audit log for bulk import
    const metadata = extractRequestMetadata(request)
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      entity: 'InventoryItem',
      entityId: 'bulk-import',
      changes: {
        successCount,
        errorCount: errors.length,
        fileName: file.name,
      },
      metadata,
    })

    return successResponse(
      {
        successCount,
        errorCount: errors.length,
        errors: errors.slice(0, 100), // Limit errors to first 100
      },
      `Successfully imported ${successCount} items with ${errors.length} errors`
    )
  } catch (error) {
    return handleApiError(error)
  }
}
