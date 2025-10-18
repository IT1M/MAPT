'use client';

import { lazy, Suspense, ComponentType } from 'react';

// Loading skeleton for report components
const ReportLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
);

// Lazy load report components
const ReportGeneratorForm = lazy(() =>
  import('./ReportGeneratorForm').then((mod) => ({ default: mod.default }))
);

const ReportHistoryTable = lazy(() =>
  import('./ReportHistoryTable').then((mod) => ({ default: mod.default }))
);

const ReportPreviewModal = lazy(() =>
  import('./ReportPreviewModal').then((mod) => ({ default: mod.default }))
);

const ReportProgressModal = lazy(() =>
  import('./ReportProgressModal').then((mod) => ({ default: mod.default }))
);

const ReportScheduleDialog = lazy(() =>
  import('./ReportScheduleDialog').then((mod) => ({ default: mod.default }))
);

const ScheduledReportsPanel = lazy(() =>
  import('./ScheduledReportsPanel').then((mod) => ({ default: mod.default }))
);

// Wrapper components with Suspense
export const LazyReportGeneratorForm: ComponentType<any> = (props) => (
  <Suspense fallback={<ReportLoadingSkeleton />}>
    <ReportGeneratorForm {...props} />
  </Suspense>
);

export const LazyReportHistoryTable: ComponentType<any> = (props) => (
  <Suspense fallback={<ReportLoadingSkeleton />}>
    <ReportHistoryTable {...props} />
  </Suspense>
);

export const LazyReportPreviewModal: ComponentType<any> = (props) => (
  <Suspense fallback={props.isOpen ? <ReportLoadingSkeleton /> : null}>
    <ReportPreviewModal {...props} />
  </Suspense>
);

export const LazyReportProgressModal: ComponentType<any> = (props) => (
  <Suspense fallback={props.isOpen ? <ReportLoadingSkeleton /> : null}>
    <ReportProgressModal {...props} />
  </Suspense>
);

export const LazyReportScheduleDialog: ComponentType<any> = (props) => (
  <Suspense fallback={props.isOpen ? <ReportLoadingSkeleton /> : null}>
    <ReportScheduleDialog {...props} />
  </Suspense>
);

export const LazyScheduledReportsPanel: ComponentType<any> = (props) => (
  <Suspense fallback={<ReportLoadingSkeleton />}>
    <ScheduledReportsPanel {...props} />
  </Suspense>
);
