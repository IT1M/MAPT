# Import Wizard Integration Guide

## Quick Start

### 1. Add Import Button to Your Page

```tsx
'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { ImportWizard } from '@/components/import';

export default function DataLogPage() {
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <div>
      {/* Add import button to your toolbar */}
      <button
        onClick={() => setIsImportOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
      >
        <Upload className="w-5 h-5" />
        Import Data
      </button>

      {/* Add the wizard */}
      <ImportWizard
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onComplete={(result) => {
          console.log('Import completed:', result);
          setIsImportOpen(false);
          // Refresh your data here
        }}
      />
    </div>
  );
}
```

### 2. Handle Import Completion

```tsx
const handleImportComplete = (result: ImportResult) => {
  // Show success message
  toast.success(
    `Successfully imported ${result.successCount} items. ${
      result.failedCount > 0 ? `${result.failedCount} items failed.` : ''
    }`
  );

  // Close wizard
  setIsImportOpen(false);

  // Refresh data
  router.refresh(); // or refetch(), or setRefreshKey(prev => prev + 1)
};
```

### 3. Add Translations (if not using English)

Add the import translations to your `messages/[locale].json` file. See `messages/en.json` for the complete structure under the `"import"` key.

## Integration Points

### Data Log Page

Add the import button to the data log toolbar:

```tsx
// src/app/[locale]/data-log/page.tsx
import { ImportWizard } from '@/components/import';

// In your component:
<div className="flex items-center justify-between mb-6">
  <h1>Data Log</h1>
  <div className="flex items-center gap-2">
    <button onClick={() => setIsImportOpen(true)}>
      <Upload className="w-5 h-5" />
      Import
    </button>
    {/* Other buttons */}
  </div>
</div>;
```

### Inventory Page

Similar integration for inventory management:

```tsx
// src/app/[locale]/inventory/page.tsx
<ImportWizard
  isOpen={isImportOpen}
  onClose={() => setIsImportOpen(false)}
  onComplete={handleImportComplete}
/>
```

### Settings Page

Add to admin settings for bulk data management:

```tsx
// src/app/[locale]/settings/page.tsx
// In the data management section
<button onClick={() => setIsImportOpen(true)}>Import Inventory Data</button>
```

## Permission Checks

Only show the import button to users with the correct permissions:

```tsx
import { useSession } from 'next-auth/react';

function ImportButton() {
  const { data: session } = useSession();
  const canImport = session?.user?.permissions?.includes('inventory:write');

  if (!canImport) {
    return null;
  }

  return <button onClick={() => setIsImportOpen(true)}>Import Data</button>;
}
```

## Customization

### Custom Success Handler

```tsx
const handleImportComplete = async (result: ImportResult) => {
  // Log to analytics
  analytics.track('import_completed', {
    successCount: result.successCount,
    failedCount: result.failedCount,
  });

  // Send notification
  if (result.failedCount > 0) {
    await fetch('/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        type: 'ALERT',
        title: 'Import Completed with Errors',
        message: `${result.failedCount} items failed to import`,
      }),
    });
  }

  // Refresh data
  mutate('/api/inventory');
};
```

### Custom Error Handler

```tsx
const handleImportError = (error: Error) => {
  console.error('Import failed:', error);
  toast.error('Import failed. Please try again.');

  // Log to error tracking service
  errorTracker.captureException(error);
};
```

## Testing

### Manual Testing Checklist

- [ ] Upload CSV file
- [ ] Upload Excel file (.xlsx)
- [ ] Upload Excel file (.xls)
- [ ] Test file size limit (>10 MB)
- [ ] Test row count limit (>10,000 rows)
- [ ] Test invalid file type
- [ ] Test empty file
- [ ] Test file with missing required columns
- [ ] Test file with invalid data
- [ ] Test duplicate handling (skip)
- [ ] Test duplicate handling (update)
- [ ] Test duplicate handling (create)
- [ ] Test default values
- [ ] Test cancellation
- [ ] Test completion with all valid rows
- [ ] Test completion with some invalid rows
- [ ] Verify audit log entry

### Sample Test Files

Create test files in `public/test-data/`:

**valid-import.csv**

```csv
Item Name,Batch,Quantity,Reject,Destination,Category,Notes
Test Item 1,TEST-001,100,5,MAIS,Test Category,Test notes
Test Item 2,TEST-002,200,10,FOZAN,Test Category,Test notes
```

**invalid-import.csv**

```csv
Item Name,Batch,Quantity,Reject,Destination,Category,Notes
,TEST-001,100,5,MAIS,Test Category,Missing item name
Test Item 2,TEST-002,abc,10,FOZAN,Test Category,Invalid quantity
Test Item 3,TEST-003,100,150,INVALID,Test Category,Invalid destination and reject > quantity
```

## Troubleshooting

### Import Button Not Showing

- Check user permissions (`inventory:write`)
- Verify component import path
- Check if button is conditionally hidden

### File Upload Fails

- Check file size (<10 MB)
- Check file format (CSV, XLSX, XLS)
- Check row count (<10,000)
- Verify file is not corrupted

### Validation Errors

- Check column mapping is correct
- Verify data types match schema
- Check for special characters in batch numbers
- Verify destination values are "MAIS" or "FOZAN"

### Import Fails

- Check API endpoint is accessible
- Verify user has `inventory:write` permission
- Check database connection
- Review server logs for errors

### Data Not Refreshing

- Ensure `onComplete` handler refreshes data
- Check if using correct refresh method (router.refresh(), refetch(), etc.)
- Verify data fetching logic

## API Reference

### ImportWizard Props

```typescript
interface ImportWizardProps {
  isOpen: boolean; // Controls wizard visibility
  onClose: () => void; // Called when wizard is closed
  onComplete?: (result: ImportResult) => void; // Called on successful import
}
```

### ImportResult Type

```typescript
interface ImportResult {
  successCount: number; // Number of successfully imported items
  failedCount: number; // Number of failed items
  errors: ValidationError[]; // Array of validation errors (max 100)
  importLogId?: string; // ID of the import log entry
}
```

### ValidationError Type

```typescript
interface ValidationError {
  row: number; // Row number (1-indexed, includes header)
  field: string; // Field name that failed validation
  value: any; // Current value
  error: string; // Error message
  suggestion?: string; // Suggested fix (optional)
}
```

## Best Practices

1. **Always handle the `onComplete` callback** to refresh your data
2. **Show user feedback** with toast notifications
3. **Check permissions** before showing import button
4. **Provide sample files** to help users understand format
5. **Log import operations** for audit trail
6. **Test with various file formats** and edge cases
7. **Handle errors gracefully** with user-friendly messages
8. **Keep users informed** with progress indicators
9. **Validate on both client and server** for security
10. **Document your import format** for users

## Support

For issues or questions:

1. Check the README.md in this directory
2. Review the implementation summary
3. Check the usage examples
4. Review the API endpoint documentation
5. Contact the development team
