'use client';

import { lazy, Suspense, ComponentType } from 'react';

// Loading skeleton for backup components
const BackupLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
);

// Lazy load backup components
const BackupConfigPanel = lazy(() =>
  import('./BackupConfigPanel').then((mod) => ({ default: mod.default }))
);

const BackupHistoryTable = lazy(() =>
  import('./BackupHistoryTable').then((mod) => ({ default: mod.default }))
);

const BackupHealthMonitor = lazy(() =>
  import('./BackupHealthMonitor').then((mod) => ({ default: mod.default }))
);

const BackupValidationPanel = lazy(() =>
  import('./BackupValidationPanel').then((mod) => ({ default: mod.default }))
);

const CreateBackupDialog = lazy(() =>
  import('./CreateBackupDialog').then((mod) => ({ default: mod.default }))
);

const RestoreBackupDialog = lazy(() =>
  import('./RestoreBackupDialog').then((mod) => ({ default: mod.default }))
);

// Wrapper components with Suspense
export const LazyBackupConfigPanel: ComponentType<any> = (props) => (
  <Suspense fallback={<BackupLoadingSkeleton />}>
    <BackupConfigPanel {...props} />
  </Suspense>
);

export const LazyBackupHistoryTable: ComponentType<any> = (props) => (
  <Suspense fallback={<BackupLoadingSkeleton />}>
    <BackupHistoryTable {...props} />
  </Suspense>
);

export const LazyBackupHealthMonitor: ComponentType<any> = (props) => (
  <Suspense fallback={<BackupLoadingSkeleton />}>
    <BackupHealthMonitor {...props} />
  </Suspense>
);

export const LazyBackupValidationPanel: ComponentType<any> = (props) => (
  <Suspense fallback={<BackupLoadingSkeleton />}>
    <BackupValidationPanel {...props} />
  </Suspense>
);

export const LazyCreateBackupDialog: ComponentType<any> = (props) => (
  <Suspense fallback={props.isOpen ? <BackupLoadingSkeleton /> : null}>
    <CreateBackupDialog {...props} />
  </Suspense>
);

export const LazyRestoreBackupDialog: ComponentType<any> = (props) => (
  <Suspense fallback={props.isOpen ? <BackupLoadingSkeleton /> : null}>
    <RestoreBackupDialog {...props} />
  </Suspense>
);
