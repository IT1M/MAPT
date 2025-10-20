import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { createAuditLog, extractRequestMetadata } from '@/utils/audit';
import {
  authRequiredError,
  insufficientPermissionsError,
  handleApiError,
} from '@/utils/api-response';
import { RateLimiter } from '@/middleware/rate-limiter';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

// Rate limiter for export operations: 10 exports per 15 minutes
const exportRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyGenerator: (req: NextRequest) => {
    const sessionId = req.cookies.get('next-auth.session-token')?.value;
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    return sessionId || ip;
  },
});

/**
 * POST /api/inventory/export/pdf
 * Export inventory data as PDF file with professional formatting
 */
export async function POST(request: NextRequest) {
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

    // Check rate limit
    const key = exportRateLimiter['config'].keyGenerator(request);
    const allowed = exportRateLimiter.check(key);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many export requests. Please try again later.',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900', // 15 minutes
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { filters, ids, options } = body;
    const orientation = options?.orientation || 'landscape';

    // Build where clause
    const where: any = {};

    // Exclude soft-deleted items
    where.deletedAt = null;

    // If specific IDs provided (for selected items export)
    if (ids && Array.isArray(ids) && ids.length > 0) {
      where.id = { in: ids };
    } else if (filters) {
      // Apply filters
      if (filters.search) {
        where.OR = [
          {
            itemName: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            batch: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        ];
      }

      if (filters.destinations && filters.destinations.length > 0) {
        where.destination = { in: filters.destinations };
      }

      if (filters.categories && filters.categories.length > 0) {
        where.category = { in: filters.categories };
      }

      // Date range filters
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Reject filter
      if (filters.rejectFilter) {
        if (filters.rejectFilter === 'none') {
          where.reject = 0;
        } else if (filters.rejectFilter === 'has') {
          where.reject = { gt: 0 };
        } else if (filters.rejectFilter === 'high') {
          // High rejects (>10%) - we'll filter this after fetching
        }
      }

      // Entered by filter (ADMIN/SUPERVISOR only)
      if (filters.enteredByIds && filters.enteredByIds.length > 0) {
        where.enteredById = { in: filters.enteredByIds };
      }
    }

    // Role-based filtering: DATA_ENTRY users only see their own items
    if (session.user.role === 'DATA_ENTRY') {
      where.enteredById = session.user.id;
    }

    // Fetch all matching items
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
      orderBy: filters?.sortBy
        ? {
            [filters.sortBy]: filters.sortOrder || 'desc',
          }
        : {
            createdAt: 'desc',
          },
    });

    // Apply high reject filter if needed (>10%)
    let filteredItems = items;
    if (filters?.rejectFilter === 'high') {
      filteredItems = items.filter((item) => {
        const rejectPercentage =
          item.quantity > 0 ? (item.reject / item.quantity) * 100 : 0;
        return rejectPercentage > 10;
      });
    }

    // Calculate totals
    const totalQuantity = filteredItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalRejects = filteredItems.reduce(
      (sum, item) => sum + item.reject,
      0
    );
    const averageRejectRate =
      totalQuantity > 0
        ? ((totalRejects / totalQuantity) * 100).toFixed(2)
        : '0.00';

    // Format filter information for display
    const filterInfo = [];
    if (filters?.search) filterInfo.push(`Search: ${filters.search}`);
    if (filters?.destinations?.length)
      filterInfo.push(`Destinations: ${filters.destinations.join(', ')}`);
    if (filters?.categories?.length)
      filterInfo.push(`Categories: ${filters.categories.join(', ')}`);
    if (filters?.startDate)
      filterInfo.push(
        `From: ${new Date(filters.startDate).toLocaleDateString()}`
      );
    if (filters?.endDate)
      filterInfo.push(`To: ${new Date(filters.endDate).toLocaleDateString()}`);
    if (filters?.rejectFilter && filters.rejectFilter !== 'all') {
      const rejectLabels = {
        none: 'No Rejects',
        has: 'Has Rejects',
        high: 'High Rejects (>10%)',
      };
      filterInfo.push(
        `Reject Filter: ${rejectLabels[filters.rejectFilter as keyof typeof rejectLabels]}`
      );
    }

    // Generate PDF
    const pdfDoc = (
      <InventoryExportDocument
        items={filteredItems}
        totalQuantity={totalQuantity}
        totalRejects={totalRejects}
        averageRejectRate={averageRejectRate}
        filterInfo={filterInfo}
        exportedBy={session.user.name}
        exportedAt={new Date()}
        orientation={orientation}
      />
    );

    const pdfBlob = await pdf(pdfDoc).toBlob();
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Create audit log
    const metadata = extractRequestMetadata(request);
    await createAuditLog({
      userId: session.user.id,
      action: 'EXPORT',
      entity: 'InventoryItem',
      entityId: 'pdf-export',
      changes: {
        format: 'pdf',
        itemCount: filteredItems.length,
        filters: filters || {},
        selectedIds: ids || [],
        orientation,
      },
      metadata,
    });

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    const fileName = `inventory-export-${timestamp}.pdf`;

    // Return file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  pageLandscape: {
    padding: 20,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 15,
    borderBottom: '2 solid #333',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#2563eb',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  filterInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  filterText: {
    fontSize: 8,
    color: '#374151',
    marginBottom: 2,
  },
  summarySection: {
    marginTop: 12,
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  summaryValue: {
    fontSize: 9,
    color: '#1e40af',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    padding: 6,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1 solid #e5e7eb',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  cellSmall: {
    width: '8%',
    fontSize: 8,
  },
  cellMedium: {
    width: '12%',
    fontSize: 8,
  },
  cellLarge: {
    width: '15%',
    fontSize: 8,
  },
  cellXLarge: {
    width: '20%',
    fontSize: 8,
  },
  cellRight: {
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#6b7280',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 8,
  },
  pageNumber: {
    textAlign: 'right',
  },
});

interface InventoryExportDocumentProps {
  items: any[];
  totalQuantity: number;
  totalRejects: number;
  averageRejectRate: string;
  filterInfo: string[];
  exportedBy: string;
  exportedAt: Date;
  orientation: 'portrait' | 'landscape';
}

function InventoryExportDocument({
  items,
  totalQuantity,
  totalRejects,
  averageRejectRate,
  filterInfo,
  exportedBy,
  exportedAt,
  orientation,
}: InventoryExportDocumentProps) {
  const pageStyle =
    orientation === 'landscape' ? styles.pageLandscape : styles.page;
  const pageSize = orientation === 'landscape' ? 'A4' : 'A4';
  const pageOrientation =
    orientation === 'landscape' ? 'landscape' : 'portrait';

  // Split items into pages (max 25 items per page for landscape, 20 for portrait)
  const itemsPerPage = orientation === 'landscape' ? 25 : 20;
  const pages = [];
  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage));
  }

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => (
        <Page
          key={pageIndex}
          size={pageSize}
          orientation={pageOrientation}
          style={pageStyle}
        >
          {/* Header - only on first page */}
          {pageIndex === 0 && (
            <>
              <View style={styles.header}>
                <Text style={styles.companyName}>
                  Medical Inventory Management System
                </Text>
                <Text style={styles.title}>Inventory Data Export</Text>
                <Text style={styles.subtitle}>Exported by: {exportedBy}</Text>
                <Text style={styles.subtitle}>
                  Export Date:{' '}
                  {exportedAt.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Filter Information */}
              {filterInfo.length > 0 && (
                <View style={styles.filterInfo}>
                  <Text
                    style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}
                  >
                    Applied Filters:
                  </Text>
                  {filterInfo.map((info, index) => (
                    <Text key={index} style={styles.filterText}>
                      • {info}
                    </Text>
                  ))}
                </View>
              )}

              {/* Summary Section */}
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Records:</Text>
                  <Text style={styles.summaryValue}>{items.length}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Quantity:</Text>
                  <Text style={styles.summaryValue}>
                    {totalQuantity.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Rejects:</Text>
                  <Text style={styles.summaryValue}>
                    {totalRejects.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Average Reject Rate:</Text>
                  <Text style={styles.summaryValue}>{averageRejectRate}%</Text>
                </View>
              </View>
            </>
          )}

          {/* Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.cellLarge]}>Item Name</Text>
              <Text style={[styles.cellMedium]}>Batch</Text>
              <Text style={[styles.cellSmall, styles.cellRight]}>Qty</Text>
              <Text style={[styles.cellSmall, styles.cellRight]}>Reject</Text>
              <Text style={[styles.cellSmall, styles.cellRight]}>Reject %</Text>
              <Text style={[styles.cellMedium]}>Destination</Text>
              <Text style={[styles.cellMedium]}>Category</Text>
              <Text style={[styles.cellMedium]}>Entered By</Text>
              <Text style={[styles.cellMedium]}>Date Added</Text>
            </View>

            {/* Table Rows */}
            {pageItems.map((item, index) => {
              const rejectPercentage =
                item.quantity > 0
                  ? ((item.reject / item.quantity) * 100).toFixed(2)
                  : '0.00';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.cellLarge]}>{item.itemName}</Text>
                  <Text style={[styles.cellMedium]}>{item.batch}</Text>
                  <Text style={[styles.cellSmall, styles.cellRight]}>
                    {item.quantity.toLocaleString()}
                  </Text>
                  <Text style={[styles.cellSmall, styles.cellRight]}>
                    {item.reject.toLocaleString()}
                  </Text>
                  <Text style={[styles.cellSmall, styles.cellRight]}>
                    {rejectPercentage}%
                  </Text>
                  <Text style={[styles.cellMedium]}>{item.destination}</Text>
                  <Text style={[styles.cellMedium]}>
                    {item.category || '-'}
                  </Text>
                  <Text style={[styles.cellMedium]}>{item.enteredBy.name}</Text>
                  <Text style={[styles.cellMedium]}>
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>Medical Inventory Management System - Confidential</Text>
            <Text style={styles.pageNumber}>
              Page {pageIndex + 1} of {pages.length}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
