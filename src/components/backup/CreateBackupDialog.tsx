'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import BackupProgressModal from './BackupProgressModal';
import { BackupCreateConfig } from '@/types/backup';

interface CreateBackupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CreateBackupDialog({ isOpen, onClose, onComplete }: CreateBackupDialogProps) {
  const t = useTranslations('backup');
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStepText] = useState('');
  
  const [formData, setFormData] = useState<BackupCreateConfig>({
    name: `mais-inventory-backup-${new Date().toISOString().split('T')[0]}`,
    includeAuditLogs: false,
    includeUserData: false,
    includeSettings: false,
    format: 'all',
    notes: '',
    encrypted: false,
  });

  const handleCreate = async () => {
    try {
      setCreating(true);
      setProgress(0);
      setCurrentStepText(t('preparingBackup'));

      const res = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to create backup');
      }

      const result = await res.json();
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 500);

      // Poll for completion
      const checkStatus = async () => {
        const statusRes = await fetch(`/api/backup/${result.backupId}`);
        if (statusRes.ok) {
          const backup = await statusRes.json();
          if (backup.status === 'COMPLETED') {
            clearInterval(progressInterval);
            setProgress(100);
            setCurrentStepText(t('backupComplete'));
            setTimeout(() => {
              onComplete();
              handleClose();
            }, 1000);
          } else if (backup.status === 'FAILED') {
            clearInterval(progressInterval);
            throw new Error('Backup failed');
          } else {
            setTimeout(checkStatus, 2000);
          }
        }
      };

      setTimeout(checkStatus, 2000);
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert(t('createFailed'));
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setStep(1);
      setFormData({
        name: `mais-inventory-backup-${new Date().toISOString().split('T')[0]}`,
        includeAuditLogs: false,
        includeUserData: false,
        includeSettings: false,
        format: 'all',
        notes: '',
        encrypted: false,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  if (creating) {
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
                {t('createBackup')}
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

            {/* Step Indicator */}
            <div className="mt-4 flex items-center justify-center space-x-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      s === step
                        ? 'bg-blue-600 text-white'
                        : s < step
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-12 h-1 ${
                        s < step ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t('backupName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t('notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('notesPlaceholder')}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Content Selection */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('selectContent')}
                </p>

                <div className="space-y-3">
                  <label className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('inventoryItems')}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('inventoryItemsDesc')}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="checkbox"
                      checked={formData.includeAuditLogs}
                      onChange={(e) => setFormData({ ...formData, includeAuditLogs: e.target.checked })}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('auditLogs')}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('auditLogsDesc')}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="checkbox"
                      checked={formData.includeUserData}
                      onChange={(e) => setFormData({ ...formData, includeUserData: e.target.checked })}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('userData')}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('userDataDesc')}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="checkbox"
                      checked={formData.includeSettings}
                      onChange={(e) => setFormData({ ...formData, includeSettings: e.target.checked })}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('systemSettings')}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('systemSettingsDesc')}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Format & Options */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t('backupFormat')}
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: t('allFormats'), desc: t('allFormatsDesc') },
                      { value: 'csv', label: 'CSV', desc: t('csvDesc') },
                      { value: 'json', label: 'JSON', desc: t('jsonDesc') },
                      { value: 'sql', label: 'SQL', desc: t('sqlDesc') },
                    ].map((format) => (
                      <label
                        key={format.value}
                        className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <input
                          type="radio"
                          name="format"
                          value={format.value}
                          checked={formData.format === format.value}
                          onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {format.label}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format.desc}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.encrypted}
                      onChange={(e) => setFormData({ ...formData, encrypted: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {t('encryptBackup')}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                    {t('encryptBackupDesc')}
                  </p>
                </div>

                {formData.encrypted && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t('encryptionPassword')}
                    </label>
                    <input
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={t('enterPassword')}
                    />
                  </div>
                )}
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
                onClick={() => step < 3 ? setStep(step + 1) : handleCreate()}
                disabled={step === 1 && !formData.name}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 3 ? t('createBackup') : t('next')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
