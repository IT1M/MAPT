/**
 * Performance Optimizer Service
 *
 * Uses AI (Gemini) to analyze performance metrics and provide
 * optimization recommendations with documentation links
 */

import { geminiService } from './gemini';
import {
  performanceMetricsService,
  PerformanceStats,
} from './performance-metrics';
import { logger } from './logger';

export interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'api' | 'database' | 'frontend' | 'infrastructure';
  impact: string;
  effort: 'low' | 'medium' | 'high';
  documentationLinks: string[];
  implementationSteps: string[];
  estimatedImprovement: string;
  implemented: boolean;
  implementedAt?: Date;
}

export interface PerformanceAnalysis {
  summary: string;
  criticalIssues: string[];
  recommendations: OptimizationRecommendation[];
  confidence: number;
  analyzedAt: Date;
}

class PerformanceOptimizerService {
  private recommendations: OptimizationRecommendation[] = [];
  private lastAnalysis: PerformanceAnalysis | null = null;
  private readonly ANALYSIS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Analyze performance metrics and generate AI-powered recommendations
   */
  async analyzePerformance(): Promise<PerformanceAnalysis> {
    // Return cached analysis if recent
    if (
      this.lastAnalysis &&
      Date.now() - this.lastAnalysis.analyzedAt.getTime() <
        this.ANALYSIS_CACHE_TTL
    ) {
      logger.info('Returning cached performance analysis');
      return this.lastAnalysis;
    }

    try {
      const stats = performanceMetricsService.getPerformanceStats(60);
      const alerts = await performanceMetricsService.checkAlertRules();

      // Check if Gemini is available
      if (!geminiService.isAvailable()) {
        logger.warn('Gemini service not available, using fallback analysis');
        return this.getFallbackAnalysis(stats, alerts);
      }

      // Generate AI analysis
      const analysis = await this.generateAIAnalysis(stats, alerts);
      this.lastAnalysis = analysis;

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze performance', error);
      const stats = performanceMetricsService.getPerformanceStats(60);
      const alerts = await performanceMetricsService.checkAlertRules();
      return this.getFallbackAnalysis(stats, alerts);
    }
  }

  /**
   * Generate AI-powered performance analysis
   */
  private async generateAIAnalysis(
    stats: PerformanceStats,
    alerts: Array<{ rule: string; message: string; severity: string }>
  ): Promise<PerformanceAnalysis> {
    const prompt = `Analyze the following system performance metrics and provide optimization recommendations:

API Performance Metrics (last 60 minutes):
- Total Requests: ${stats.apiMetrics.totalRequests}
- Average Response Time: ${stats.apiMetrics.avgResponseTime.toFixed(0)}ms
- P50: ${stats.apiMetrics.p50.toFixed(0)}ms
- P95: ${stats.apiMetrics.p95.toFixed(0)}ms
- P99: ${stats.apiMetrics.p99.toFixed(0)}ms
- Error Rate: ${(stats.apiMetrics.errorRate * 100).toFixed(2)}%

Error Breakdown:
${Object.entries(stats.errorMetrics.byType)
  .map(([type, count]) => `- ${type}: ${count} errors`)
  .join('\n')}

Slow Endpoints:
${stats.slowEndpoints.map((e) => `- ${e.endpoint}: ${e.avgDuration.toFixed(0)}ms avg (${e.count} requests)`).join('\n')}

Active Alerts:
${alerts.map((a) => `- [${a.severity.toUpperCase()}] ${a.message}`).join('\n')}

Provide:
1. A brief summary of overall system performance
2. List of critical issues that need immediate attention
3. 5-7 specific optimization recommendations with:
   - Title and description
   - Priority (high/medium/low)
   - Category (api/database/frontend/infrastructure)
   - Impact description
   - Effort required (low/medium/high)
   - Implementation steps
   - Estimated improvement
   - Relevant documentation links (Next.js, Prisma, PostgreSQL, React)

Return ONLY a valid JSON object with this structure:
{
  "summary": "brief performance summary",
  "criticalIssues": ["issue 1", "issue 2"],
  "recommendations": [
    {
      "title": "recommendation title",
      "description": "detailed description",
      "priority": "high|medium|low",
      "category": "api|database|frontend|infrastructure",
      "impact": "expected impact description",
      "effort": "low|medium|high",
      "documentationLinks": ["https://...", "https://..."],
      "implementationSteps": ["step 1", "step 2"],
      "estimatedImprovement": "e.g., 30% faster response time"
    }
  ],
  "confidence": 0.85
}`;

    try {
      const model = geminiService['genAI']?.getGenerativeModel({
        model: 'gemini-pro',
      });
      if (!model) {
        throw new Error('Gemini model not available');
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI');
      }

      const aiResponse = JSON.parse(jsonMatch[0]);

      // Add IDs and default values to recommendations
      const recommendations: OptimizationRecommendation[] =
        aiResponse.recommendations.map((rec: any, index: number) => ({
          id: `rec-${Date.now()}-${index}`,
          ...rec,
          implemented: false,
        }));

      // Store recommendations
      this.recommendations = recommendations;

      return {
        summary: aiResponse.summary,
        criticalIssues: aiResponse.criticalIssues,
        recommendations,
        confidence: aiResponse.confidence,
        analyzedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to generate AI analysis', error);
      throw error;
    }
  }

  /**
   * Get fallback analysis when AI is unavailable
   */
  private getFallbackAnalysis(
    stats: PerformanceStats,
    alerts: Array<{ rule: string; message: string; severity: string }>
  ): PerformanceAnalysis {
    const recommendations: OptimizationRecommendation[] = [];
    const criticalIssues: string[] = [];

    // Analyze API performance
    if (stats.apiMetrics.p95 > 2000) {
      criticalIssues.push(
        `High API response times (P95: ${stats.apiMetrics.p95.toFixed(0)}ms)`
      );

      recommendations.push({
        id: `rec-${Date.now()}-1`,
        title: 'Optimize Slow API Endpoints',
        description:
          'Several API endpoints are responding slowly. Consider implementing caching, database query optimization, and response compression.',
        priority: 'high',
        category: 'api',
        impact: 'Reduce API response times by 40-60%',
        effort: 'medium',
        documentationLinks: [
          'https://nextjs.org/docs/app/building-your-application/caching',
          'https://www.prisma.io/docs/guides/performance-and-optimization',
        ],
        implementationSteps: [
          'Identify slowest endpoints from metrics',
          'Add database indexes for frequently queried fields',
          'Implement response caching with appropriate TTL',
          'Use Prisma select to limit returned fields',
        ],
        estimatedImprovement: '40-60% faster response times',
        implemented: false,
      });
    }

    // Analyze error rate
    if (stats.apiMetrics.errorRate > 0.05) {
      criticalIssues.push(
        `High error rate (${(stats.apiMetrics.errorRate * 100).toFixed(2)}%)`
      );

      recommendations.push({
        id: `rec-${Date.now()}-2`,
        title: 'Reduce API Error Rate',
        description:
          'Error rate is above acceptable threshold. Review error logs and implement better error handling and validation.',
        priority: 'high',
        category: 'api',
        impact: 'Improve system reliability and user experience',
        effort: 'medium',
        documentationLinks: [
          'https://nextjs.org/docs/app/building-your-application/routing/error-handling',
        ],
        implementationSteps: [
          'Review error logs to identify common error patterns',
          'Add input validation with Zod schemas',
          'Implement proper error boundaries',
          'Add retry logic for transient failures',
        ],
        estimatedImprovement: 'Reduce errors by 70-80%',
        implemented: false,
      });
    }

    // Check for slow endpoints
    if (stats.slowEndpoints.length > 0) {
      const slowestEndpoint = stats.slowEndpoints[0];

      recommendations.push({
        id: `rec-${Date.now()}-3`,
        title: `Optimize ${slowestEndpoint.endpoint} Endpoint`,
        description: `This endpoint has an average response time of ${slowestEndpoint.avgDuration.toFixed(0)}ms. Consider database query optimization and caching.`,
        priority: 'high',
        category: 'database',
        impact: 'Significantly improve response time for this endpoint',
        effort: 'low',
        documentationLinks: [
          'https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance',
        ],
        implementationSteps: [
          'Review database queries in this endpoint',
          'Add appropriate indexes',
          'Use Prisma include/select efficiently',
          'Implement query result caching',
        ],
        estimatedImprovement: '50-70% faster response time',
        implemented: false,
      });
    }

    // General recommendations
    recommendations.push({
      id: `rec-${Date.now()}-4`,
      title: 'Implement Database Connection Pooling',
      description:
        'Optimize database connection management to reduce connection overhead and improve query performance.',
      priority: 'medium',
      category: 'database',
      impact: 'Reduce database connection overhead',
      effort: 'low',
      documentationLinks: [
        'https://www.prisma.io/docs/guides/performance-and-optimization/connection-management',
      ],
      implementationSteps: [
        'Configure Prisma connection pool size',
        'Set appropriate connection timeout',
        'Monitor connection pool usage',
      ],
      estimatedImprovement: '10-20% improvement in database operations',
      implemented: false,
    });

    recommendations.push({
      id: `rec-${Date.now()}-5`,
      title: 'Enable Response Compression',
      description:
        'Compress API responses to reduce bandwidth usage and improve load times.',
      priority: 'medium',
      category: 'api',
      impact: 'Reduce response size by 60-80%',
      effort: 'low',
      documentationLinks: [
        'https://nextjs.org/docs/app/api-reference/next-config-js/compress',
      ],
      implementationSteps: [
        'Enable compression in Next.js config',
        'Configure compression middleware',
        'Test with large responses',
      ],
      estimatedImprovement: '60-80% smaller response sizes',
      implemented: false,
    });

    const summary =
      criticalIssues.length > 0
        ? `System performance needs attention. ${criticalIssues.length} critical issues detected.`
        : `System performance is within acceptable ranges. ${recommendations.length} optimization opportunities identified.`;

    return {
      summary,
      criticalIssues,
      recommendations,
      confidence: 0.6,
      analyzedAt: new Date(),
    };
  }

  /**
   * Get all recommendations
   */
  getRecommendations(): OptimizationRecommendation[] {
    return [...this.recommendations];
  }

  /**
   * Mark recommendation as implemented
   */
  markAsImplemented(recommendationId: string): void {
    const rec = this.recommendations.find((r) => r.id === recommendationId);
    if (rec) {
      rec.implemented = true;
      rec.implementedAt = new Date();
      logger.info('Recommendation marked as implemented', { recommendationId });
    }
  }

  /**
   * Get implementation progress
   */
  getImplementationProgress(): {
    total: number;
    implemented: number;
    percentage: number;
  } {
    const total = this.recommendations.length;
    const implemented = this.recommendations.filter(
      (r) => r.implemented
    ).length;

    return {
      total,
      implemented,
      percentage: total > 0 ? (implemented / total) * 100 : 0,
    };
  }

  /**
   * Clear cache and force new analysis
   */
  clearCache(): void {
    this.lastAnalysis = null;
    logger.info('Performance analysis cache cleared');
  }
}

// Export singleton instance
export const performanceOptimizerService = new PerformanceOptimizerService();
