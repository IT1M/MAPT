import { NextRequest } from 'next/server'
import { prisma } from '@/services/prisma'
import { checkAuth } from '@/middleware/auth'
import { 
  successResponse, 
  handleApiError, 
  validationError,
  insufficientPermissionsError 
} from '@/utils/api-response'
import { reportGenerationSchema } from '@/utils/validators'
import { createAuditLog, extractRequestMetadata } from '@/utils/audit'
import { geminiService } from '@/services/gemini'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * POST /api/reports/generate
 * 
 * Generate a comprehensive report with analytics and optional AI insights
 * 
 * Request Body:
 * - type: ReportType (MONTHLY, YEARLY, CUSTOM, AUDIT)
 * - periodStart: ISO date string
 * - periodEnd: ISO date string
 * - includeCharts: boolean (optional, default: true)
 * - includeAiInsights: boolean (optional, default: false)
 * 
 * Requirements: 7.1, 7.4
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check permissions (reports:view required)
    if (!context.user.permissions.includes('reports:view')) {
      return insufficientPermissionsError('Permission to generate reports required')
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = reportGenerationSchema.safeParse(body)

    if (!validationResult.success) {
      return validationError('Invalid request body', validationResult.error.errors)
    }

    const { type, periodStart, periodEnd, includeCharts, includeAiInsights } = validationResult.data

    // Generate report title
    const title = `${type} Report - ${new Date(periodStart).toLocaleDateString()} to ${new Date(periodEnd).toLocaleDateString()}`

    // Create report record with GENERATING status
    const report = await prisma.report.create({
      data: {
        title,
        type,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        generatedById: context.user.id,
        status: 'GENERATING',
        dataSnapshot: {},
      },
    })

    try {
      // Fetch inventory data for specified period
      const whereClause: any = {
        deletedAt: null,
        createdAt: {
          gte: new Date(periodStart),
          lte: new Date(periodEnd),
        },
      }

      // Apply role-based filtering
      if (context.user.role === 'DATA_ENTRY') {
        whereClause.enteredById = context.user.id
      }

      const inventoryItems = await prisma.inventoryItem.findMany({
        where: whereClause,
        include: {
          enteredBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Generate analytics summary
      const totalItems = inventoryItems.length
      const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalReject = inventoryItems.reduce((sum, item) => sum + item.reject, 0)
      const rejectRate = totalQuantity > 0 ? (totalReject / totalQuantity) * 100 : 0

      // Group by destination
      const byDestination = {
        MAIS: {
          items: inventoryItems.filter(i => i.destination === 'MAIS').length,
          quantity: inventoryItems.filter(i => i.destination === 'MAIS').reduce((sum, i) => sum + i.quantity, 0),
        },
        FOZAN: {
          items: inventoryItems.filter(i => i.destination === 'FOZAN').length,
          quantity: inventoryItems.filter(i => i.destination === 'FOZAN').reduce((sum, i) => sum + i.quantity, 0),
        },
      }

      // Group by category
      const categoryMap = new Map<string, { items: number; quantity: number }>()
      inventoryItems.forEach(item => {
        const category = item.category || 'Uncategorized'
        const existing = categoryMap.get(category) || { items: 0, quantity: 0 }
        categoryMap.set(category, {
          items: existing.items + 1,
          quantity: existing.quantity + item.quantity,
        })
      })

      const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        ...data,
      }))

      // Generate trends data
      const monthlyData = new Map<string, { items: number; quantity: number; reject: number }>()
      inventoryItems.forEach(item => {
        const month = item.createdAt.toISOString().substring(0, 7) // YYYY-MM
        const existing = monthlyData.get(month) || { items: 0, quantity: 0, reject: 0 }
        monthlyData.set(month, {
          items: existing.items + 1,
          quantity: existing.quantity + item.quantity,
          reject: existing.reject + item.reject,
        })
      })

      const trends = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))

      const analyticsData = {
        summary: {
          totalItems,
          totalQuantity,
          rejectRate: Math.round(rejectRate * 100) / 100,
          byDestination,
          byCategory,
        },
        trends,
      }

      // Generate AI insights if requested
      let aiInsights: string | null = null
      if (includeAiInsights && geminiService.isAvailable()) {
        try {
          // Prepare data for Gemini
          const inventoryData = Array.from(categoryMap.entries()).map(([category, data]) => ({
            productId: category,
            productName: category,
            currentStock: data.quantity,
            minStockLevel: 0,
            maxStockLevel: data.quantity * 2,
            reorderPoint: Math.floor(data.quantity * 0.3),
          }))

          // Get insights from Gemini
          const [insights, predictions] = await Promise.all([
            geminiService.generateInsights(inventoryData),
            geminiService.predictStockNeeds(inventoryData),
          ])

          aiInsights = JSON.stringify({
            insights,
            predictions,
            generatedAt: new Date().toISOString(),
          })
        } catch (error) {
          console.error('Failed to generate AI insights:', error)
          aiInsights = JSON.stringify({
            error: 'AI insights temporarily unavailable',
            insights: [],
            predictions: [],
          })
        }
      }

      // Generate PDF
      const pdfDoc = (
        <ReportDocument
          title={title}
          type={type}
          periodStart={new Date(periodStart)}
          periodEnd={new Date(periodEnd)}
          analytics={analyticsData}
          aiInsights={aiInsights ? JSON.parse(aiInsights) : null}
          generatedBy={context.user.name}
          generatedAt={new Date()}
        />
      )

      const pdfBlob = await pdf(pdfDoc).toBlob()
      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())

      // Save PDF to /public/reports/ directory
      const reportsDir = join(process.cwd(), 'public', 'reports')
      if (!existsSync(reportsDir)) {
        await mkdir(reportsDir, { recursive: true })
      }

      const timestamp = Date.now()
      const fileName = `report-${report.id}-${timestamp}.pdf`
      const filePath = join(reportsDir, fileName)
      await writeFile(filePath, pdfBuffer)

      const fileUrl = `/reports/${fileName}`

      // Update report status to COMPLETED
      const updatedReport = await prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'COMPLETED',
          fileUrl,
          dataSnapshot: analyticsData,
          aiInsights,
        },
        include: {
          generatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Create audit log
      const metadata = extractRequestMetadata(request)
      await createAuditLog({
        userId: context.user.id,
        action: 'CREATE',
        entity: 'Report',
        entityId: report.id,
        changes: {
          newValue: {
            id: report.id,
            title,
            type,
            periodStart,
            periodEnd,
          },
        },
        metadata,
      })

      return successResponse(
        {
          id: updatedReport.id,
          title: updatedReport.title,
          type: updatedReport.type,
          periodStart: updatedReport.periodStart.toISOString(),
          periodEnd: updatedReport.periodEnd.toISOString(),
          status: updatedReport.status,
          fileUrl: updatedReport.fileUrl,
          generatedBy: updatedReport.generatedBy,
          createdAt: updatedReport.createdAt.toISOString(),
        },
        'Report generated successfully',
        201
      )
    } catch (error) {
      // Update report status to FAILED
      await prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'FAILED',
        },
      })

      throw error
    }
  } catch (error) {
    return handleApiError(error)
  }
}

// PDF Document Component
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #333',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e0e0e0',
  },
  tableCell: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
    borderTop: '1 solid #e0e0e0',
    paddingTop: 10,
  },
  insight: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderLeft: '3 solid #4CAF50',
  },
  insightWarning: {
    borderLeft: '3 solid #FF9800',
  },
  insightInfo: {
    borderLeft: '3 solid #2196F3',
  },
})

interface ReportDocumentProps {
  title: string
  type: string
  periodStart: Date
  periodEnd: Date
  analytics: any
  aiInsights: any
  generatedBy: string
  generatedAt: Date
}

function ReportDocument({
  title,
  type,
  periodStart,
  periodEnd,
  analytics,
  aiInsights,
  generatedBy,
  generatedAt,
}: ReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Report Type: {type}</Text>
          <Text style={styles.subtitle}>
            Period: {periodStart.toLocaleDateString()} - {periodEnd.toLocaleDateString()}
          </Text>
          <Text style={styles.subtitle}>Generated by: {generatedBy}</Text>
          <Text style={styles.subtitle}>Generated at: {generatedAt.toLocaleString()}</Text>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Items:</Text>
            <Text style={styles.value}>{analytics.summary.totalItems}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Quantity:</Text>
            <Text style={styles.value}>{analytics.summary.totalQuantity}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reject Rate:</Text>
            <Text style={styles.value}>{analytics.summary.rejectRate}%</Text>
          </View>
        </View>

        {/* By Destination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Destination</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCell}>Destination</Text>
              <Text style={styles.tableCell}>Items</Text>
              <Text style={styles.tableCell}>Quantity</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>MAIS</Text>
              <Text style={styles.tableCell}>{analytics.summary.byDestination.MAIS.items}</Text>
              <Text style={styles.tableCell}>{analytics.summary.byDestination.MAIS.quantity}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>FOZAN</Text>
              <Text style={styles.tableCell}>{analytics.summary.byDestination.FOZAN.items}</Text>
              <Text style={styles.tableCell}>{analytics.summary.byDestination.FOZAN.quantity}</Text>
            </View>
          </View>
        </View>

        {/* By Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Category</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCell}>Category</Text>
              <Text style={styles.tableCell}>Items</Text>
              <Text style={styles.tableCell}>Quantity</Text>
            </View>
            {analytics.summary.byCategory.slice(0, 10).map((cat: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{cat.category}</Text>
                <Text style={styles.tableCell}>{cat.items}</Text>
                <Text style={styles.tableCell}>{cat.quantity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Insights */}
        {aiInsights && aiInsights.insights && aiInsights.insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI-Generated Insights</Text>
            {aiInsights.insights.slice(0, 5).map((insight: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.insight,
                  insight.type === 'warning' && styles.insightWarning,
                  insight.type === 'info' && styles.insightInfo,
                ]}
              >
                <Text>{insight.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Medical Inventory Management System - Confidential Report</Text>
          <Text>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  )
}
