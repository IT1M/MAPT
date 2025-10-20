/**
 * Example usage of the ImportWizard component
 *
 * This example shows how to integrate the import wizard into your page
 */

'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { ImportWizard } from '@/components/import';
import type { ImportResult } from '@/types/import';
import { toast } from '@/utils/toast';

export default function ImportExample() {
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleImportComplete = (result: ImportResult) => {
    // Show success message
    toast.success(
      `Successfully imported ${result.successCount} items. ${result.failedCount} items failed.`
    );

    // Close the wizard
    setIsImportOpen(false);

    // Refresh your data here
    // For example: refetch(), router.refresh(), etc.
    console.log('Import completed:', result);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Inventory Management
        </h1>

        {/* Import Button */}
        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          Import Data
        </button>

        {/* Import Wizard */}
        <ImportWizard
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onComplete={handleImportComplete}
        />

        {/* Your existing content */}
        <div className="mt-6">{/* Your inventory table, list, etc. */}</div>
      </div>
    </div>
  );
}

/**
 * Alternative: Using in a data log page
 */
export function DataLogWithImport() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImportComplete = (result: ImportResult) => {
    toast.success(`Imported ${result.successCount} items`);
    setIsImportOpen(false);

    // Trigger data refresh
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      {/* Header with Import Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Data Log</h1>
        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Upload className="w-5 h-5" />
          Import
        </button>
      </div>

      {/* Data Table */}
      <div key={refreshKey}>{/* Your data table component */}</div>

      {/* Import Wizard */}
      <ImportWizard
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onComplete={handleImportComplete}
      />
    </div>
  );
}

/**
 * Alternative: With permission check
 */
export function ImportWithPermissions({
  userPermissions,
}: {
  userPermissions: string[];
}) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const canImport = userPermissions.includes('inventory:write');

  if (!canImport) {
    return null; // Or show a disabled button
  }

  return (
    <>
      <button
        onClick={() => setIsImportOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
      >
        <Upload className="w-5 h-5" />
        Import Data
      </button>

      <ImportWizard
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onComplete={(result) => {
          console.log('Import result:', result);
          setIsImportOpen(false);
        }}
      />
    </>
  );
}
