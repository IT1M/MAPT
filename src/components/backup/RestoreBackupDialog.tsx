'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Backup, RestoreOptions } from '@/types/backup';
import BackupProgressModal from './BackupProgressModal';

interface RestoreBackupDialogProps {
  backup: Backup;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RestoreBackupDialog({
  backup,
  isOpen,
  onConfirm,
  onCancel,
}: RestoreBackupDialogProps) {
  const t = useTranslations('backup');
  const [step, setStep] = useState(1);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStepText] = useState('');
  
  const [options, setOptions] = useState<RestoreOptions>({
    mode: 'preview',
    adminPassword: '',
  });

  const handleRestore = async () => {
    if (!options.adminPassword) {
      alert(t('adminPasswordRequired'));
      return;
    }

    try {
      setRestoring(true);
      setProgress(0);
      setCurrentStepText(t('preparingRestore'));

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId: backup.id,
          ...options,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Restore failed');
      }

      const result = await res.json();

      // Simulate progress
      const progressSteps = [
        { progress: 20, text: t('validatingBackup') },
        { progress: 40, text: t('restoringData') },
        { progress: 60, text: t('updatingRecords') },
        { progress: 80, text: t('verifyingIntegrity') },
        { progress: 100, text: t('restoreComplete') },
      ];

      for (const progressStep of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(progressStep.progress);
        setCurrentStepText(progressStep.text);
      }

      setTimeout(() => {
        onConfirm();
      }, 1000);
    } catch (error: any) {
      console.error('Restore failed:', error);
      alert(error.message || t('restoreFailed'));
      setRestoring(false);
    }
  };

  const handleClose = () => {
    if (!restoring) {
      setStep(1);
      setOptions({
        mode: 'preview',
        adminPassword: '',
      });
      onCancel();
    }
  };

  if (!isOpen) return null;

  if (restoring) {
    return (
      <BackupProgressModal
        isOpen={true}
        progress={progress}
        currentStep={currentStep}
        onCancel={() => {}}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('restoreBackup')}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Step 1: Backup Info & Mode Selection */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Warning */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        {t('restoreWarning')}
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        {t('restoreWarningDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Backup Info */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    {t('backupDetails')}
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('filename')}:</dt>
                      <dd className="text-gray-900 dark:text-white font-medium">{backup.filename}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('created')}:</dt>
                      <dd className="text-gray-900 dark:text-white">{new Date(backup.createdAt).toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('records')}:</dt>
                      <dd className="text-gray-900 dark:text-white">{backup.recordCount.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('createdBy')}:</dt>
                      <dd className="text-gray-900 dark:text-white">{backup.creator.name}</dd>
                    </div>
                  </dl>
                </div>

                {/* Restore Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                    {t('restoreMode')}
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      style={{
                        borderColor: options.mode === 'preview' ? 'rgb(37, 99, 235)' : 'rgb(229, 231, 235)',
                      }}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value="preview"
                        checked={options.mode === 'preview'}
                        onChange={(e) => setOptions({ ...options, mode: e.target.value as any })}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('previewMode')}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('previewModeDesc')}
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      style={{
                        borderColor: options.mode === 'merge' ? 'rgb(37, 99, 235)' : 'rgb(229, 231, 235)',
                      }}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value="merge"
                        checked={options.mode === 'merge'}
                        onChange={(e) => setOptions({ ...options, mode: e.target.value as any })}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('mergeMode')}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('mergeModeDesc')}
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      style={{
                        borderColor: options.mode === 'full' ? 'rgb(37, 99, 235)' : 'rgb(229, 231, 235)',
                      }}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value="full"
                        checked={options.mode === 'full'}
                        onChange={(e) => setOptions({ ...options, mode: e.target.value as any })}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          {t('fullMode')}
                          <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded">
                            {t('destructive')}
                          </span>
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('fullModeDesc')}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Encryption Password */}
                {backup.encrypted && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t('backupPassword')}
                    </label>
                    <input
                      type="password"
                      value={options.password || ''}
                      onChange={(e) => setOptions({ ...options, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('enterBackupPassword')}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('backupPasswordDesc')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Confirmation */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Final Warning */}
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                        {t('confirmRestore')}
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {options.mode === 'full' ? t('confirmRestoreFull') : t('confirmRestoreDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t('adminPassword')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={options.adminPassword}
                    onChange={(e) => setOptions({ ...options, adminPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('enterAdminPassword')}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('adminPasswordDesc')}
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    {t('restoreSummary')}
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('mode')}:</dt>
                      <dd className="text-gray-900 dark:text-white font-medium">{t(options.mode + 'Mode')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('backup')}:</dt>
                      <dd className="text-gray-900 dark:text-white">{backup.filename}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('recordsToRestore')}:</dt>
                      <dd className="text-gray-900 dark:text-white">{backup.recordCount.toLocaleString()}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {step === 1 ? t('cancel') : t('back')}
              </button>
              <button
                onClick={() => step < 2 ? setStep(step + 1) : handleRestore()}
                disabled={step === 2 && !options.adminPassword}
                className={`px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  step === 2
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {step === 2 ? t('confirmRestore') : t('next')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
