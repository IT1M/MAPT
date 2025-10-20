'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { X, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import FileUploadStep from './FileUploadStep';
import ColumnMappingStep from './ColumnMappingStep';
import ValidationStep from './ValidationStep';
import ImportOptionsStep from './ImportOptionsStep';
import ReviewStep from './ReviewStep';
import ProgressStep from './ProgressStep';
import type {
  ImportFile,
  ColumnMapping,
  ValidationError,
  ImportOptions,
  ImportProgress,
  ImportResult,
  ParsedData,
  ImportStep,
} from '@/types/import';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: ImportResult) => void;
}

const STEPS: ImportStep[] = [
  'upload',
  'mapping',
  'validation',
  'options',
  'review',
  'progress',
];

export default function ImportWizard({
  isOpen,
  onClose,
  onComplete,
}: ImportWizardProps) {
  const t = useTranslations('import');
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [importFile, setImportFile] = useState<ImportFile | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    itemName: null,
    batch: null,
    quantity: null,
    reject: null,
    destination: null,
    category: null,
    notes: null,
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    duplicateHandling: 'skip',
  });
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    status: 'idle',
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileUpload = useCallback((file: ImportFile, data: ParsedData) => {
    setImportFile(file);
    setParsedData(data);
    setCurrentStep('mapping');
  }, []);

  const handleMappingComplete = useCallback((mapping: ColumnMapping) => {
    setColumnMapping(mapping);
    setCurrentStep('validation');
  }, []);

  const handleValidationComplete = useCallback((errors: ValidationError[]) => {
    setValidationErrors(errors);
    setCurrentStep('options');
  }, []);

  const handleOptionsComplete = useCallback((options: ImportOptions) => {
    setImportOptions(options);
    setCurrentStep('review');
  }, []);

  const handleReviewConfirm = useCallback(() => {
    setCurrentStep('progress');
  }, []);

  const handleImportComplete = useCallback(
    (result: ImportResult) => {
      setImportResult(result);
      onComplete?.(result);
    },
    [onComplete]
  );

  const handleClose = useCallback(() => {
    if (importProgress.status === 'processing') {
      if (!confirm(t('confirmCancel'))) {
        return;
      }
    }
    // Reset state
    setCurrentStep('upload');
    setImportFile(null);
    setParsedData(null);
    setColumnMapping({
      itemName: null,
      batch: null,
      quantity: null,
      reject: null,
      destination: null,
      category: null,
      notes: null,
    });
    setValidationErrors([]);
    setImportOptions({ duplicateHandling: 'skip' });
    setImportProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      status: 'idle',
    });
    setImportResult(null);
    onClose();
  }, [importProgress.status, onClose, t]);

  const handleBack = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  }, [currentStep]);

  if (!isOpen) return null;

  const currentStepIndex = STEPS.indexOf(currentStep);
  const canGoBack = currentStepIndex > 0 && currentStep !== 'progress';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('title')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t(`steps.${currentStep}.title`)}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={importProgress.status === 'processing'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      index < currentStepIndex
                        ? 'bg-teal-600 text-white'
                        : index === currentStepIndex
                          ? 'bg-teal-600 text-white ring-4 ring-teal-100 dark:ring-teal-900/30'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      index <= currentStepIndex
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {t(`steps.${step}.label`)}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      index < currentStepIndex
                        ? 'bg-teal-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'upload' && (
            <FileUploadStep onFileUpload={handleFileUpload} />
          )}
          {currentStep === 'mapping' && parsedData && (
            <ColumnMappingStep
              parsedData={parsedData}
              initialMapping={columnMapping}
              onComplete={handleMappingComplete}
              onBack={handleBack}
            />
          )}
          {currentStep === 'validation' && parsedData && (
            <ValidationStep
              parsedData={parsedData}
              columnMapping={columnMapping}
              onComplete={handleValidationComplete}
              onBack={handleBack}
            />
          )}
          {currentStep === 'options' && (
            <ImportOptionsStep
              initialOptions={importOptions}
              validationErrors={validationErrors}
              onComplete={handleOptionsComplete}
              onBack={handleBack}
            />
          )}
          {currentStep === 'review' && parsedData && (
            <ReviewStep
              importFile={importFile!}
              parsedData={parsedData}
              columnMapping={columnMapping}
              validationErrors={validationErrors}
              importOptions={importOptions}
              onConfirm={handleReviewConfirm}
              onBack={handleBack}
            />
          )}
          {currentStep === 'progress' && parsedData && (
            <ProgressStep
              parsedData={parsedData}
              columnMapping={columnMapping}
              importOptions={importOptions}
              validationErrors={validationErrors}
              onComplete={handleImportComplete}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
