import { NextRequest } from 'next/server'
import { checkAuth } from '@/middleware/auth'
import { successResponse, handleApiError, validationError } from '@/utils/api-response'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * POST /api/analytics/export
 * 
 * Generate a PDF export of the analytics dashboard
 * 
 * Request Body:
 * - summary: Analytics summary data
 * - filters: Applied filters
 * - charts: Chart data (optional)
 * - insights: AI insights (optional)
 * - timestamp: Export timestamp
 * - format: 'pdf' | 'email'
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if ('error' in authResult) {
      return authResult.error
    }

    const { context } = authResult

    // Check permissions (SUPERVISOR+ required)
    const allowedRoles = ['SUPERVISOR', 'MANAGER', 'ADMIN']
    if (!allowedRoles.includes(context.user.role)) {
      return validationError('Insufficient permissions to export dashboard')
    }

    // Parse request body
    const body = await request.json()
    const { summary, filters, charts, insights, timestamp, format } = body

    if (!summary) {
      return validationError('Summary data is required')
    }

    // Generate PDF document
    const pdfDoc = (
      <DashboardPDFDocument
        summary={summary}
        filters={filters || {}}
        charts={charts || []}
        insights={insights || []}
        timestamp={timestamp ? new Date(timestamp) : new Date()}
        generatedBy={context.user.name}
      />
    )

    // Generate PDF blob
    const pdfBlob = await pdf(pdfDoc).toBlob()
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())

    // Save PDF to /public/exports/ directory
    const exportsDir = join(process.cwd(), 'public', 'exports')
    if (!existsSync(exportsDir)) {
      await mkdir(exportsDir, { recursive: true })
    }

    const exportTimestamp = Date.now()
    const fileName = `analytics-dashboard-${exportTimestamp}.pdf`
    const filePath = join(exportsDir, fileName)
    await writeFile(filePath, pdfBuffer)

    const fileUrl = `/exports/${fileName}`

    // If email format requested, would send email here
    // For now, just return the file URL
    if (format === 'email') {
      // TODO: Implement email sending
      // await sendEmail(context.user.email, 'Analytics Dashboard Report', fileUrl)
    }

    return successResponse(
      {
        fileUrl,
        fileName,
        format,
        generatedAt: new Date().toISOString(),
      },
      'Dashboard exported successfully',
      200
    )
  } catch (error) {
    return handleApiError(error)
  }
}

// ============================================================================
// PDF Document Component
// ============================================================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827',
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
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
    color: '#1f2937',
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 5,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    border: '1 solid #e5e7eb',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  kpiSubtitle: {
    fontSize: 9,
    color: '#9ca3af',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#374151',
  },
  value: {
    width: '60%',
    color: '#6b7280',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '2 solid #d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  insight: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f0f9ff',
    borderLeft: '3 solid #3b82f6',
    borderRadius: 2,
  },
  insightAlert: {
    backgroundColor: '#fef2f2',
    borderLeft: '3 solid #ef4444',
  },
  insightRecommendation: {
    backgroundColor: '#f0fdf4',
    borderLeft: '3 solid #22c55e',
  },
  insightText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
  },
  filterBadge: {
    padding: '4 8',
    backgroundColor: '#dbeafe',
    borderRadius: 3,
    marginRight: 5,
    marginBottom: 5,
  },
  filterText: {
    fontSize: 9,
    color: '#1e40af',
  },
  chartPlaceholder: {
    padding: 20,
    backgroundColor: '#f9fafb',
    border: '1 dashed #d1d5db',
    borderRadius: 4,
    textAlign: 'center',
    marginTop: 10,
  },
  chartPlaceholderText: {
    fontSize: 10,
    color: '#9ca3af',
  },
})

interface DashboardPDFDocumentProps {
  summary: {
    totalItems: number
    totalQuantity: number
    rejectRate: number
    activeUsers: number
    categoriesCount: number
    avgDailyEntries: number
    maisPercentage: number
    fozanPercentage: number
    topContributor?: { name: string; count: number }
    mostActiveCategory?: string
  }
  filters: {
    startDate?: string | null
    endDate?: string | null
    destinations?: string[]
    categories?: string[]
  }
  charts: any[]
  insights: any[]
  timestamp: Date
  generatedBy: string
}

function DashboardPDFDocument({
  summary,
  filters,
  charts,
  insights,
  timestamp,
  generatedBy,
}: DashboardPDFDocumentProps) {
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US')
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Saudi Mais Co. Medical Inventory</Text>
          <Text style={styles.title}>📊 Analytics Dashboard Report</Text>
          <Text style={styles.subtitle}>
            Generated: {formatDate(timestamp)} at {timestamp.toLocaleTimeString()}
          </Text>
          <Text style={styles.subtitle}>Generated by: {generatedBy}</Text>
          {filters.startDate && filters.endDate && (
            <Text style={styles.subtitle}>
              Period: {formatDate(filters.startDate)} - {formatDate(filters.endDate)}
            </Text>
          )}
        </View>

        {/* Applied Filters */}
        {(filters.destinations?.length || filters.categories?.length) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Applied Filters</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {filters.destinations?.map((dest, index) => (
                <View key={`dest-${index}`} style={styles.filterBadge}>
                  <Text style={styles.filterText}>Destination: {dest}</Text>
                </View>
              ))}
              {filters.categories?.map((cat, index) => (
                <View key={`cat-${index}`} style={styles.filterBadge}>
                  <Text style={styles.filterText}>Category: {cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* KPI Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.kpiGrid}>
            {/* Total Items */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>📦 Total Items</Text>
              <Text style={styles.kpiValue}>{formatNumber(summary.totalItems)}</Text>
            </View>

            {/* Total Quantity */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>📊 Total Quantity</Text>
              <Text style={styles.kpiValue}>{formatNumber(summary.totalQuantity)}</Text>
              <Text style={styles.kpiSubtitle}>
                Mais: {summary.maisPercentage.toFixed(1)}% | Fozan: {summary.fozanPercentage.toFixed(1)}%
              </Text>
            </View>

            {/* Reject Rate */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>⚠️ Reject Rate</Text>
              <Text style={styles.kpiValue}>{summary.rejectRate.toFixed(2)}%</Text>
            </View>

            {/* Active Users */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>👥 Active Users</Text>
              <Text style={styles.kpiValue}>{formatNumber(summary.activeUsers)}</Text>
              {summary.topContributor && (
                <Text style={styles.kpiSubtitle}>
                  Top: {summary.topContributor.name} ({summary.topContributor.count})
                </Text>
              )}
            </View>

            {/* Categories */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>🏷️ Categories</Text>
              <Text style={styles.kpiValue}>{formatNumber(summary.categoriesCount)}</Text>
              {summary.mostActiveCategory && (
                <Text style={styles.kpiSubtitle}>Most active: {summary.mostActiveCategory}</Text>
              )}
            </View>

            {/* Average Daily Entries */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>📈 Avg Daily Entries</Text>
              <Text style={styles.kpiValue}>{summary.avgDailyEntries.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Charts Section */}
        {charts && charts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Charts & Visualizations</Text>
            {charts.map((chart, index) => (
              <View key={index} style={styles.chartPlaceholder}>
                <Text style={styles.chartPlaceholderText}>
                  {chart.title || `Chart ${index + 1}`}
                </Text>
                <Text style={styles.chartPlaceholderText}>
                  {chart.data?.length || 0} data points
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Insights */}
        {insights && insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 AI-Generated Insights</Text>
            {insights.slice(0, 8).map((insight, index) => (
              <View
                key={index}
                style={
                  insight.type === 'alert'
                    ? [styles.insight, styles.insightAlert]
                    : insight.type === 'recommendation'
                    ? [styles.insight, styles.insightRecommendation]
                    : styles.insight
                }
              >
                <Text style={styles.insightText}>
                  {insight.type === 'alert' && '⚠️ '}
                  {insight.type === 'recommendation' && '💡 '}
                  {insight.type === 'finding' && '🔍 '}
                  {insight.type === 'prediction' && '📈 '}
                  {insight.message}
                </Text>
                {insight.confidence && (
                  <Text style={[styles.insightText, { marginTop: 4, fontSize: 9, color: '#6b7280' }]}>
                    Confidence: {(insight.confidence * 100).toFixed(0)}%
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Saudi Mais Co. Medical Inventory Management System</Text>
          <Text>Confidential Report - For Internal Use Only</Text>
          <Text>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  )
}
