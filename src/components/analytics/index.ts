// AI Components
export { AIInsightsPanel } from './AIInsightsPanel';
export { AIQuestionInput } from './AIQuestionInput';
export { AIInsightsSectionWrapper } from './AIInsightsSectionWrapper';
export type { AIInsight, DashboardContext } from './AIInsightsPanel';
export type { QuestionAnswer, InventoryContext } from './AIQuestionInput';

// KPI Components
export { KPICard } from './KPICard';
export { KPICardsSection } from './KPICardsSection';
export { KPICardsSectionWrapper } from './KPICardsSectionWrapper';

// Filter Components
export { GlobalFilters } from './GlobalFilters';
export { GlobalFiltersWrapper } from './GlobalFiltersWrapper';
export type { AnalyticsFilterState, FilterUser } from './GlobalFilters';

// Export Components
export { DashboardExporter } from './DashboardExporter';
export { DashboardExporterWrapper } from './DashboardExporterWrapper';
export type { DashboardSnapshot, ChartSnapshot } from './DashboardExporter';

// Accessibility and Performance Components
export { AccessibleChartWrapper } from './AccessibleChartWrapper';
export { ChartErrorBoundary, useErrorHandler } from './ChartErrorBoundary';
export {
  ChartSkeleton,
  KPICardSkeleton,
  DashboardSkeleton,
} from './ChartSkeleton';
export {
  LazyChart,
  LazyInventoryTrendChart,
  LazyDestinationChart,
  LazyCategoryChart,
  LazyRejectAnalysisChart,
  LazyUserActivityHeatmap,
  LazyMonthlyComparisonChart,
} from './LazyChart';

// Chart exports
export * from './charts';

// Main Dashboard Component
export { AnalyticsDashboard } from './AnalyticsDashboard';
