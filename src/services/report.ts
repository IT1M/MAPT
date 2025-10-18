/**
 * Report Service
 * Handles report generation, AI insights, email delivery, and scheduling
 */

import { prisma } from './prisma';
import { geminiService } from './gemini';
import { ReportType, ReportFormat, ReportStatus, ScheduleFrequency } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import ExcelJS from 'exceljs';
import pptxgen from 'pptxgenjs';
import nodemailer from 'nodemailer';
import cron from 'node-cron';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ReportConfig {
  type: ReportType;
  dateRange: { from: Date; to: Date };
  content: {
    summary: boolean;
    charts: boolean;
    detailedTable: boolean;
    rejectAnalysis: boolean;
    destinationBreakdown: boolean;
    categoryAnalysis: boolean;
    aiInsights: boolean;
    userActivity: boolean;
    auditTrail: boolean;
    comparative: boolean;
  };
  format: ReportFormat;
  customization: {
    includeLogo: boolean;
    includeSignature: boolean;
    language: 'en' | 'ar' | 'bilingual';
    paperSize: 'a4' | 'letter';
    orientation: 'portrait' | 'landscape';
  };
  email?: {
    enabled: boolean;
    recipients: string[];
    subject: string;
    message: string;
  };
}

export interface AIInsights {
  trends: string[];
  anomalies: string[];
  recommendations: string[];
  predictions: string[];
}

export interface ReportData {
  inventoryItems: any[];
  statistics: {
    totalItems: number;
    totalQuantity: number;
    rejectCount: number;
    rejectRate: number;
    destinationBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
  };
  charts?: {
    inventoryTrend?: any[];
    destinationPie?: any[];
    categoryBar?: any[];
    rejectRate?: any[];
  };
  userActivity?: any[];
  auditTrail?: any[];
  aiInsights?: AIInsights;
}

export class ReportError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'ReportError';
  }
}

// ============================================================================
// Report Service Class
// ============================================================================

export class ReportService {
  private static instance: ReportService | null = null;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private emailTransporter: nodemailer.Transporter | null = null;

  private constructor() {
    this.initializeEmailTransporter();
    this.loadScheduledReports();
  }

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeEmailTransporter(): void {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      this.emailTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
      console.log('[ReportService] Email transporter initialized');
    } else {
      console.warn('[ReportService] Email configuration incomplete, email features disabled');
    }
  }

  private async loadScheduledReports(): Promise<void> {
    try {
      const schedules = await prisma.reportSchedule.findMany({
        where: { enabled: true },
      });

      for (const schedule of schedules) {
        this.scheduleReport(schedule.id, schedule);
      }

      console.log(`[ReportService] Loaded ${schedules.length} scheduled reports`);
    } catch (error) {
      console.error('[ReportService] Error loading scheduled reports:', error);
    }
  }

  // ============================================================================
  // Main Report Generation
  // ============================================================================

  async generateReport(
    config: ReportConfig,
    userId: string,
    onProgress?: (progress: number, step: string) => void
  ): Promise<string> {
    try {
      onProgress?.(10, 'Fetching inventory data');
      const reportData = await this.fetchReportData(config);

      onProgress?.(25, 'Calculating statistics');

      if (config.content.charts) {
        onProgress?.(40, 'Generating charts');
        reportData.charts = await this.generateChartData(reportData);
      }

      if (config.content.aiInsights) {
        onProgress?.(60, 'Requesting AI insights');
        reportData.aiInsights = await this.getAIInsights(reportData);
      }

      onProgress?.(80, 'Creating document');
      let filePath: string;

      switch (config.format) {
        case 'PDF':
          filePath = await this.generatePDF(reportData, config);
          break;
        case 'EXCEL':
          filePath = await this.generateExcel(reportData, config);
          break;
        case 'PPTX':
          filePath = await this.generatePPTX(reportData, config);
          break;
        default:
          throw new ReportError('Unsupported report format', 'INVALID_FORMAT');
      }

      onProgress?.(95, 'Finalizing and saving');

      // Save report record to database
      const fileStats = await fs.stat(filePath);
      const report = await prisma.report.create({
        data: {
          title: this.generateReportTitle(config),
          type: config.type,
          periodFrom: config.dateRange.from,
          periodTo: config.dateRange.to,
          generatedBy: userId,
          filePath: filePath,
          fileSize: BigInt(fileStats.size),
          format: config.format,
          includeAIInsights: config.content.aiInsights,
          status: ReportStatus.COMPLETED,
        },
      });

      onProgress?.(100, 'Report ready');

      // Send email if configured
      if (config.email?.enabled && config.email.recipients.length > 0) {
        await this.emailReport(
          report.id,
          config.email.recipients,
          config.email.subject,
          config.email.message
        );
      }

      return report.id;
    } catch (error) {
      console.error('[ReportService] Error generating report:', error);
      throw new ReportError(
        error instanceof Error ? error.message : 'Failed to generate report',
        'GENERATION_FAILED'
      );
    }
  }

  // ============================================================================
  // Data Fetching
  // ============================================================================

  private async fetchReportData(config: ReportConfig): Promise<ReportData> {
    const { dateRange, content } = config;

    // Fetch inventory items within date range
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
        deletedAt: null,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const totalItems = inventoryItems.length;
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const rejectCount = inventoryItems.reduce((sum, item) => sum + item.reject, 0);
    const rejectRate = totalQuantity > 0 ? (rejectCount / totalQuantity) * 100 : 0;

    // Destination breakdown
    const destinationBreakdown: Record<string, number> = {};
    inventoryItems.forEach((item) => {
      destinationBreakdown[item.destination] =
        (destinationBreakdown[item.destination] || 0) + item.quantity;
    });

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    inventoryItems.forEach((item) => {
      if (item.category) {
        categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
      }
    });

    const reportData: ReportData = {
      inventoryItems,
      statistics: {
        totalItems,
        totalQuantity,
        rejectCount,
        rejectRate,
        destinationBreakdown,
        categoryBreakdown,
      },
    };

    // Fetch user activity if requested
    if (content.userActivity) {
      reportData.userActivity = await this.fetchUserActivity(dateRange);
    }

    // Fetch audit trail if requested
    if (content.auditTrail) {
      reportData.auditTrail = await this.fetchAuditTrail(dateRange);
    }

    return reportData;
  }

  private async fetchUserActivity(dateRange: { from: Date; to: Date }): Promise<any[]> {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
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

    // Group by user and count actions
    const userActivityMap = new Map<string, any>();

    auditLogs.forEach((log) => {
      const userId = log.userId;
      if (!userActivityMap.has(userId)) {
        userActivityMap.set(userId, {
          user: log.user,
          totalActions: 0,
          actionBreakdown: {},
        });
      }

      const activity = userActivityMap.get(userId)!;
      activity.totalActions++;
      activity.actionBreakdown[log.action] = (activity.actionBreakdown[log.action] || 0) + 1;
    });

    return Array.from(userActivityMap.values()).sort((a, b) => b.totalActions - a.totalActions);
  }

  private async fetchAuditTrail(dateRange: { from: Date; to: Date }): Promise<any[]> {
    return await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100, // Limit to most recent 100 entries for report
    });
  }

  // ============================================================================
  // Chart Data Generation
  // ============================================================================

  private async generateChartData(reportData: ReportData): Promise<any> {
    const { inventoryItems, statistics } = reportData;

    // Inventory trend over time
    const inventoryTrend = this.calculateInventoryTrend(inventoryItems);

    // Destination pie chart data
    const destinationPie = Object.entries(statistics.destinationBreakdown).map(([name, value]) => ({
      name,
      value,
    }));

    // Category bar chart data
    const categoryBar = Object.entries(statistics.categoryBreakdown).map(([name, value]) => ({
      name,
      value,
    }));

    // Reject rate over time
    const rejectRate = this.calculateRejectRateTrend(inventoryItems);

    return {
      inventoryTrend,
      destinationPie,
      categoryBar,
      rejectRate,
    };
  }

  private calculateInventoryTrend(items: any[]): any[] {
    const trendMap = new Map<string, { date: string; quantity: number; count: number }>();

    items.forEach((item) => {
      const dateKey = item.createdAt.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, { date: dateKey, quantity: 0, count: 0 });
      }
      const trend = trendMap.get(dateKey)!;
      trend.quantity += item.quantity;
      trend.count += 1;
    });

    return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateRejectRateTrend(items: any[]): any[] {
    const trendMap = new Map<string, { date: string; rejectRate: number; count: number }>();

    items.forEach((item) => {
      const dateKey = item.createdAt.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, { date: dateKey, rejectRate: 0, count: 0 });
      }
      const trend = trendMap.get(dateKey)!;
      const rate = item.quantity > 0 ? (item.reject / item.quantity) * 100 : 0;
      trend.rejectRate = (trend.rejectRate * trend.count + rate) / (trend.count + 1);
      trend.count += 1;
    });

    return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  // ============================================================================
  // AI Insights Integration
  // ============================================================================

  async getAIInsights(reportData: ReportData): Promise<AIInsights> {
    try {
      if (!geminiService.isAvailable()) {
        console.warn('[ReportService] Gemini AI not available, using fallback insights');
        return this.getFallbackInsights(reportData);
      }

      const { statistics, inventoryItems } = reportData;

      // Prepare data for AI analysis
      const prompt = `Analyze this inventory report data and provide comprehensive insights:

Period: ${inventoryItems.length} items processed
Total Quantity: ${statistics.totalQuantity} units
Reject Count: ${statistics.rejectCount} units
Reject Rate: ${statistics.rejectRate.toFixed(2)}%

Destination Breakdown:
${Object.entries(statistics.destinationBreakdown)
  .map(([dest, qty]) => `- ${dest}: ${qty} units`)
  .join('\n')}

Category Breakdown:
${Object.entries(statistics.categoryBreakdown)
  .map(([cat, count]) => `- ${cat}: ${count} items`)
  .join('\n')}

Top Items:
${inventoryItems
  .slice(0, 10)
  .map((item) => `- ${item.itemName}: ${item.quantity} units (${item.destination})`)
  .join('\n')}

Provide:
1. Key trends identified in the data
2. Any anomalies or unusual patterns
3. Actionable recommendations for improvement
4. Predictions for future inventory needs

Return ONLY a valid JSON object with this exact structure:
{
  "trends": ["trend 1", "trend 2", "trend 3"],
  "anomalies": ["anomaly 1", "anomaly 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "predictions": ["prediction 1", "prediction 2"]
}`;

      // Use Gemini service (it has its own generateContent method)
      const response = await (geminiService as any).generateContent(prompt);

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const insights: AIInsights = JSON.parse(jsonMatch[0]);
      return insights;
    } catch (error) {
      console.error('[ReportService] Error getting AI insights:', error);
      return this.getFallbackInsights(reportData);
    }
  }

  private getFallbackInsights(reportData: ReportData): AIInsights {
    const { statistics } = reportData;

    const trends: string[] = [];
    const anomalies: string[] = [];
    const recommendations: string[] = [];
    const predictions: string[] = [];

    // Analyze reject rate
    if (statistics.rejectRate > 5) {
      trends.push(`High reject rate of ${statistics.rejectRate.toFixed(2)}% observed`);
      recommendations.push('Review quality control processes to reduce reject rate');
    } else if (statistics.rejectRate < 2) {
      trends.push('Low reject rate indicates effective quality control');
    }

    // Analyze destination distribution
    const destinations = Object.entries(statistics.destinationBreakdown);
    if (destinations.length > 0) {
      const [topDest, topQty] = destinations.reduce((a, b) => (a[1] > b[1] ? a : b));
      trends.push(`${topDest} is the primary destination with ${topQty} units`);

      const distribution = destinations.map(([_, qty]) => qty);
      const maxDist = Math.max(...distribution);
      const minDist = Math.min(...distribution);
      if (maxDist / minDist > 3) {
        anomalies.push('Significant imbalance in destination distribution detected');
        recommendations.push('Consider balancing inventory distribution across destinations');
      }
    }

    // Analyze categories
    const categories = Object.entries(statistics.categoryBreakdown);
    if (categories.length > 0) {
      const [topCat, topCount] = categories.reduce((a, b) => (a[1] > b[1] ? a : b));
      trends.push(`${topCat} is the most common category with ${topCount} items`);
    }

    // General predictions
    predictions.push('Maintain current inventory levels for stable operations');
    predictions.push('Monitor reject rates closely for quality assurance');

    return {
      trends: trends.length > 0 ? trends : ['Inventory patterns appear stable'],
      anomalies: anomalies.length > 0 ? anomalies : ['No significant anomalies detected'],
      recommendations:
        recommendations.length > 0
          ? recommendations
          : ['Continue current inventory management practices'],
      predictions,
    };
  }

  // ============================================================================
  // PDF Generation (Simplified - using plain text format)
  // ============================================================================

  async generatePDF(reportData: ReportData, config: ReportConfig): Promise<string> {
    const { statistics, aiInsights } = reportData;

    // Create a simple text-based PDF content
    // In production, you would use a proper PDF library like pdfkit or jsPDF
    const content = `
${'='.repeat(80)}
${this.generateReportTitle(config)}
${'='.repeat(80)}

Period: ${config.dateRange.from.toLocaleDateString()} - ${config.dateRange.to.toLocaleDateString()}
Generated: ${new Date().toLocaleString()}

${'-'.repeat(80)}
EXECUTIVE SUMMARY
${'-'.repeat(80)}

Total Items: ${statistics.totalItems}
Total Quantity: ${statistics.totalQuantity} units
Reject Count: ${statistics.rejectCount} units
Reject Rate: ${statistics.rejectRate.toFixed(2)}%

${'-'.repeat(80)}
DESTINATION BREAKDOWN
${'-'.repeat(80)}

${Object.entries(statistics.destinationBreakdown)
  .map(([dest, qty]) => `${dest}: ${qty} units (${((qty / statistics.totalQuantity) * 100).toFixed(2)}%)`)
  .join('\n')}

${'-'.repeat(80)}
CATEGORY BREAKDOWN
${'-'.repeat(80)}

${Object.entries(statistics.categoryBreakdown)
  .map(([cat, count]) => `${cat}: ${count} items`)
  .join('\n')}

${
  config.content.aiInsights && aiInsights
    ? `
${'-'.repeat(80)}
AI-POWERED INSIGHTS
${'-'.repeat(80)}

TRENDS:
${aiInsights.trends.map((t, i) => `${i + 1}. ${t}`).join('\n')}

ANOMALIES:
${aiInsights.anomalies.map((a, i) => `${i + 1}. ${a}`).join('\n')}

RECOMMENDATIONS:
${aiInsights.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

PREDICTIONS:
${aiInsights.predictions.map((p, i) => `${i + 1}. ${p}`).join('\n')}

* Generated using AI - review for accuracy
`
    : ''
}

${'-'.repeat(80)}
End of Report
${'-'.repeat(80)}
`;

    // Save to file
    const reportsDir = process.env.REPORT_STORAGE_PATH || path.join(process.cwd(), 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const filename = `report-${Date.now()}.txt`;
    const filePath = path.join(reportsDir, filename);

    await fs.writeFile(filePath, content, 'utf-8');

    console.log(`[ReportService] PDF report generated at ${filePath}`);
    return filePath;
  }

  // ============================================================================
  // Excel Generation
  // ============================================================================

  async generateExcel(reportData: ReportData, config: ReportConfig): Promise<string> {
    const { inventoryItems, statistics, aiInsights } = reportData;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MAIS Inventory System';
    workbook.created = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    summarySheet.addRows([
      {
        metric: 'Report Period',
        value: `${config.dateRange.from.toLocaleDateString()} - ${config.dateRange.to.toLocaleDateString()}`,
      },
      { metric: 'Total Items', value: statistics.totalItems },
      { metric: 'Total Quantity', value: statistics.totalQuantity },
      { metric: 'Reject Count', value: statistics.rejectCount },
      { metric: 'Reject Rate', value: `${statistics.rejectRate.toFixed(2)}%` },
    ]);

    // Style header row
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };

    // Inventory Items Sheet
    if (config.content.detailedTable) {
      const itemsSheet = workbook.addWorksheet('Inventory Items');
      itemsSheet.columns = [
        { header: 'Item Name', key: 'itemName', width: 30 },
        { header: 'Batch Number', key: 'batchNumber', width: 20 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Quantity', key: 'quantity', width: 15 },
        { header: 'Reject Qty', key: 'rejectQuantity', width: 15 },
        { header: 'Destination', key: 'destination', width: 15 },
        { header: 'Date', key: 'date', width: 20 },
      ];

      inventoryItems.forEach((item) => {
        itemsSheet.addRow({
          itemName: item.itemName,
          batchNumber: item.batch,
          category: item.category || 'N/A',
          quantity: item.quantity,
          rejectQuantity: item.reject || 0,
          destination: item.destination,
          date: item.createdAt.toLocaleDateString(),
        });
      });

      // Style header row
      itemsSheet.getRow(1).font = { bold: true };
      itemsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' },
      };
    }

    // Destination Breakdown Sheet
    if (config.content.destinationBreakdown) {
      const destSheet = workbook.addWorksheet('Destination Breakdown');
      destSheet.columns = [
        { header: 'Destination', key: 'destination', width: 20 },
        { header: 'Quantity', key: 'quantity', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 },
      ];

      Object.entries(statistics.destinationBreakdown).forEach(([dest, qty]) => {
        destSheet.addRow({
          destination: dest,
          quantity: qty,
          percentage: `${((qty / statistics.totalQuantity) * 100).toFixed(2)}%`,
        });
      });

      destSheet.getRow(1).font = { bold: true };
      destSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' },
      };
    }

    // AI Insights Sheet
    if (config.content.aiInsights && aiInsights) {
      const insightsSheet = workbook.addWorksheet('AI Insights');
      insightsSheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Insight', key: 'insight', width: 60 },
      ];

      aiInsights.trends.forEach((trend) => {
        insightsSheet.addRow({ category: 'Trend', insight: trend });
      });

      aiInsights.anomalies.forEach((anomaly) => {
        insightsSheet.addRow({ category: 'Anomaly', insight: anomaly });
      });

      aiInsights.recommendations.forEach((rec) => {
        insightsSheet.addRow({ category: 'Recommendation', insight: rec });
      });

      insightsSheet.getRow(1).font = { bold: true };
      insightsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' },
      };
    }

    // Save to file
    const reportsDir = process.env.REPORT_STORAGE_PATH || path.join(process.cwd(), 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const filename = `report-${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, filename);

    await workbook.xlsx.writeFile(filePath);

    console.log(`[ReportService] Excel report generated at ${filePath}`);
    return filePath;
  }

  // ============================================================================
  // PowerPoint Generation
  // ============================================================================

  async generatePPTX(reportData: ReportData, config: ReportConfig): Promise<string> {
    const { statistics, aiInsights } = reportData;

    const pres = new pptxgen();

    // Title Slide
    const titleSlide = pres.addSlide();
    titleSlide.background = { color: '4F46E5' };
    titleSlide.addText(this.generateReportTitle(config), {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1,
      fontSize: 44,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });
    titleSlide.addText(
      `${config.dateRange.from.toLocaleDateString()} - ${config.dateRange.to.toLocaleDateString()}`,
      {
        x: 0.5,
        y: 3.5,
        w: 9,
        h: 0.5,
        fontSize: 24,
        color: 'FFFFFF',
        align: 'center',
      }
    );

    // Summary Slide
    const summarySlide = pres.addSlide();
    summarySlide.addText('Executive Summary', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.75,
      fontSize: 32,
      bold: true,
      color: '4F46E5',
    });

    const summaryData: any[] = [
      ['Metric', 'Value'],
      ['Total Items', statistics.totalItems.toString()],
      ['Total Quantity', `${statistics.totalQuantity} units`],
      ['Reject Count', `${statistics.rejectCount} units`],
      ['Reject Rate', `${statistics.rejectRate.toFixed(2)}%`],
    ];

    summarySlide.addTable(summaryData as any, {
      x: 1,
      y: 1.5,
      w: 8,
      h: 3,
      fontSize: 18,
      border: { pt: 1, color: 'CCCCCC' },
      fill: { color: 'F3F4F6' },
      color: '1F2937',
    });

    // Destination Breakdown Slide
    if (config.content.destinationBreakdown) {
      const destSlide = pres.addSlide();
      destSlide.addText('Destination Breakdown', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.75,
        fontSize: 32,
        bold: true,
        color: '4F46E5',
      });

      const destData: any[] = [
        ['Destination', 'Quantity', 'Percentage'],
        ...Object.entries(statistics.destinationBreakdown).map(([dest, qty]) => [
          dest,
          qty.toString(),
          `${((qty / statistics.totalQuantity) * 100).toFixed(2)}%`,
        ]),
      ];

      destSlide.addTable(destData as any, {
        x: 1,
        y: 1.5,
        w: 8,
        h: 3,
        fontSize: 18,
        border: { pt: 1, color: 'CCCCCC' },
        fill: { color: 'F3F4F6' },
        color: '1F2937',
      });
    }

    // AI Insights Slide
    if (config.content.aiInsights && aiInsights) {
      const insightsSlide = pres.addSlide();
      insightsSlide.addText('🤖 AI-Powered Insights', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.75,
        fontSize: 32,
        bold: true,
        color: '4F46E5',
      });

      let yPos = 1.5;

      // Trends
      insightsSlide.addText('Key Trends:', {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.4,
        fontSize: 20,
        bold: true,
        color: '1F2937',
      });
      yPos += 0.5;

      aiInsights.trends.slice(0, 3).forEach((trend) => {
        insightsSlide.addText(`• ${trend}`, {
          x: 0.7,
          y: yPos,
          w: 8.5,
          h: 0.4,
          fontSize: 16,
          color: '4B5563',
        });
        yPos += 0.4;
      });

      yPos += 0.3;

      // Recommendations
      insightsSlide.addText('Recommendations:', {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.4,
        fontSize: 20,
        bold: true,
        color: '1F2937',
      });
      yPos += 0.5;

      aiInsights.recommendations.slice(0, 3).forEach((rec) => {
        insightsSlide.addText(`• ${rec}`, {
          x: 0.7,
          y: yPos,
          w: 8.5,
          h: 0.4,
          fontSize: 16,
          color: '4B5563',
        });
        yPos += 0.4;
      });

      // Disclaimer
      insightsSlide.addText('* Generated using AI - review for accuracy', {
        x: 0.5,
        y: 5.5,
        w: 9,
        h: 0.3,
        fontSize: 12,
        italic: true,
        color: '9CA3AF',
      });
    }

    // Save to file
    const reportsDir = process.env.REPORT_STORAGE_PATH || path.join(process.cwd(), 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const filename = `report-${Date.now()}.pptx`;
    const filePath = path.join(reportsDir, filename);

    await pres.writeFile({ fileName: filePath });

    console.log(`[ReportService] PowerPoint report generated at ${filePath}`);
    return filePath;
  }

  // ============================================================================
  // Email Functionality
  // ============================================================================

  async emailReport(
    reportId: string,
    recipients: string[],
    subject: string,
    message: string
  ): Promise<void> {
    if (!this.emailTransporter) {
      throw new ReportError('Email service not configured', 'EMAIL_NOT_CONFIGURED');
    }

    try {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new ReportError('Report not found', 'REPORT_NOT_FOUND');
      }

      const fileBuffer = await fs.readFile(report.filePath);
      const filename = path.basename(report.filePath);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@mais-inventory.com',
        to: recipients.join(', '),
        subject: subject || `Report: ${report.title}`,
        text:
          message ||
          `Please find attached the report "${report.title}" generated on ${report.createdAt.toLocaleString()}.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">MAIS Inventory Report</h2>
            <p>${message || `Please find attached the report "${report.title}" generated on ${report.createdAt.toLocaleString()}.`}</p>
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Report Title:</strong> ${report.title}</p>
              <p><strong>Period:</strong> ${report.periodStart.toLocaleDateString()} - ${report.periodEnd.toLocaleDateString()}</p>
              <p><strong>Generated:</strong> ${report.createdAt.toLocaleString()}</p>
            </div>
            <p style="color: #6B7280; font-size: 14px;">This is an automated message from MAIS Inventory System.</p>
          </div>
        `,
        attachments: [
          {
            filename,
            content: fileBuffer,
          },
        ],
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`[ReportService] Report ${reportId} emailed to ${recipients.length} recipients`);
    } catch (error) {
      console.error('[ReportService] Error emailing report:', error);
      throw new ReportError(
        error instanceof Error ? error.message : 'Failed to email report',
        'EMAIL_FAILED'
      );
    }
  }

  // ============================================================================
  // Scheduling Functionality
  // ============================================================================

  scheduleReport(scheduleId: string, schedule: any): void {
    // Stop existing job if any
    if (this.scheduledJobs.has(scheduleId)) {
      this.scheduledJobs.get(scheduleId)!.stop();
      this.scheduledJobs.delete(scheduleId);
    }

    if (!schedule.enabled) {
      return;
    }

    // Parse time (HH:mm format)
    const [hours, minutes] = schedule.time.split(':').map(Number);

    // Create cron expression based on frequency
    let cronExpression: string;

    switch (schedule.frequency) {
      case 'DAILY':
        cronExpression = `${minutes} ${hours} * * *`;
        break;
      case 'WEEKLY':
        cronExpression = `${minutes} ${hours} * * 1`; // Monday
        break;
      case 'MONTHLY':
        cronExpression = `${minutes} ${hours} 1 * *`; // First day of month
        break;
      case 'YEARLY':
        cronExpression = `${minutes} ${hours} 1 1 *`; // January 1st
        break;
      default:
        console.error(`[ReportService] Invalid frequency: ${schedule.frequency}`);
        return;
    }

    try {
      const task = cron.schedule(
        cronExpression,
        async () => {
          console.log(`[ReportService] Executing scheduled report: ${schedule.name}`);
          await this.executeScheduledReport(scheduleId);
        },
        {
          timezone: process.env.CRON_TIMEZONE || 'Asia/Riyadh',
        }
      );

      this.scheduledJobs.set(scheduleId, task);
      console.log(
        `[ReportService] Scheduled report "${schedule.name}" with cron: ${cronExpression}`
      );
    } catch (error) {
      console.error(`[ReportService] Error scheduling report ${scheduleId}:`, error);
    }
  }

  async executeScheduledReport(scheduleId: string): Promise<string> {
    try {
      const schedule = await prisma.reportSchedule.findUnique({
        where: { id: scheduleId },
      });

      if (!schedule || !schedule.enabled) {
        throw new ReportError('Schedule not found or disabled', 'SCHEDULE_NOT_FOUND');
      }

      // Parse config from JSON
      const config: ReportConfig = schedule.config as any;

      // Update date range to current period based on frequency
      config.dateRange = this.calculateDateRangeForFrequency(schedule.frequency);

      // Generate report
      const reportId = await this.generateReport(config, schedule.createdBy, undefined);

      // Update schedule last run and next run
      const nextRun = this.calculateNextRun(schedule.frequency, schedule.time);
      await prisma.reportSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRun: new Date(),
          nextRun,
        },
      });

      // Email to recipients
      if (schedule.recipients.length > 0) {
        const report = await prisma.report.findUnique({ where: { id: reportId } });
        if (report) {
          await this.emailReport(
            reportId,
            schedule.recipients,
            `Scheduled Report: ${schedule.name}`,
            `Your scheduled report "${schedule.name}" has been generated.`
          );
        }
      }

      console.log(`[ReportService] Scheduled report ${scheduleId} executed successfully`);
      return reportId;
    } catch (error) {
      console.error(`[ReportService] Error executing scheduled report ${scheduleId}:`, error);
      throw new ReportError(
        error instanceof Error ? error.message : 'Failed to execute scheduled report',
        'SCHEDULE_EXECUTION_FAILED'
      );
    }
  }

  private calculateDateRangeForFrequency(
    frequency: ScheduleFrequency
  ): { from: Date; to: Date } {
    const now = new Date();
    const to = new Date(now);
    let from = new Date(now);

    switch (frequency) {
      case 'DAILY':
        from.setDate(from.getDate() - 1);
        break;
      case 'WEEKLY':
        from.setDate(from.getDate() - 7);
        break;
      case 'MONTHLY':
        from.setMonth(from.getMonth() - 1);
        break;
      case 'YEARLY':
        from.setFullYear(from.getFullYear() - 1);
        break;
    }

    return { from, to };
  }

  private calculateNextRun(frequency: ScheduleFrequency, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date(now);

    next.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'DAILY':
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + ((1 + 7 - next.getDay()) % 7 || 7));
        if (next <= now) {
          next.setDate(next.getDate() + 7);
        }
        break;
      case 'MONTHLY':
        next.setDate(1);
        next.setMonth(next.getMonth() + 1);
        break;
      case 'YEARLY':
        next.setMonth(0, 1);
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  unscheduleReport(scheduleId: string): void {
    if (this.scheduledJobs.has(scheduleId)) {
      this.scheduledJobs.get(scheduleId)!.stop();
      this.scheduledJobs.delete(scheduleId);
      console.log(`[ReportService] Unscheduled report ${scheduleId}`);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private generateReportTitle(config: ReportConfig): string {
    const typeNames: Record<ReportType, string> = {
      MONTHLY_INVENTORY: 'Monthly Inventory Report',
      YEARLY_SUMMARY: 'Yearly Summary Report',
      CUSTOM_RANGE: 'Custom Range Report',
      AUDIT_REPORT: 'Audit Report',
      USER_ACTIVITY: 'User Activity Report',
      CATEGORY_ANALYSIS: 'Category Analysis Report',
    };

    return typeNames[config.type] || 'Inventory Report';
  }

  async getReportById(reportId: string): Promise<any> {
    return await prisma.report.findUnique({
      where: { id: reportId },
    });
  }

  async deleteReport(reportId: string): Promise<void> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new ReportError('Report not found', 'REPORT_NOT_FOUND');
    }

    // Delete file
    try {
      if (report.filePath) {
        await fs.unlink(report.filePath);
      }
    } catch (error) {
      console.warn(`[ReportService] Could not delete file ${report.filePath}:`, error);
    }

    // Delete database record
    await prisma.report.delete({
      where: { id: reportId },
    });

    console.log(`[ReportService] Deleted report ${reportId}`);
  }

  async listReports(filters: {
    page?: number;
    limit?: number;
    type?: ReportType;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ reports: any[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.search) {
      where.title = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return { reports, total };
  }
}

// Export singleton instance
export const reportService = ReportService.getInstance();
