# Data Import System

A comprehensive multi-step wizard for importing inventory data from CSV and Excel files.

## Features

- **File Upload**: Drag & drop or browse for CSV/Excel files (max 10 MB)
- **Auto-Detection**: Automatically detects and maps columns to system fields
- **Validation**: Real-time validation with detailed error messages and suggestions
- **Import Options**: Configure duplicate handling and default values
- **Progress Tracking**: Visual progress indicator during import
- **Audit Logging**: All imports are logged for audit trail

## Usage

```tsx
import { ImportWizard } from '@/components/import';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = (result) => {
    console.log(`Imported ${result.successCount} items`);
    console.log(`Failed: ${result.failedCount}`);
    setIsOpen(false);
    // Refresh your data here
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Import Data</button>

      <ImportWizard
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={handleComplete}
      />
    </>
  );
}
```

## File Format Requirements

### Required Columns

- **Item Name**: Name of the inventory item (2-100 characters)
- **Batch**: Batch number (alphanumeric with hyphens, 3-50 characters)
- **Quantity**: Number of items (positive integer)
- **Destination**: Either "MAIS" or "FOZAN"

### Optional Columns

- **Reject**: Number of rejected items (default: 0)
- **Category**: Item category
- **Notes**: Additional notes (max 5000 characters)

### Example CSV

```csv
Item Name,Batch,Quantity,Reject,Destination,Category,Notes
Surgical Gloves,BATCH-2024-001,1000,10,MAIS,Surgical Supplies,High quality latex gloves
Face Masks,BATCH-2024-002,5000,50,FOZAN,PPE,N95 respirator masks
```

### Example Excel

The system supports both `.xlsx` and `.xls` formats. The first sheet will be used for import.

## Import Steps

### 1. Upload

- Drag and drop or browse for your file
- Supports CSV, XLSX, and XLS formats
- Maximum file size: 10 MB
- Maximum rows: 10,000

### 2. Column Mapping

- System automatically detects column mappings
- Manual adjustment available for all fields
- Shows example values from your file
- Validates that all required fields are mapped

### 3. Validation

- Validates all data against schema rules
- Shows detailed error messages with row numbers
- Provides suggestions for fixing common errors
- Displays summary of valid vs invalid rows

### 4. Import Options

- **Duplicate Handling**:
  - Skip: Ignore items that already exist
  - Update: Update existing items with new values
  - Create: Always create new items
- **Default Values**: Set defaults for optional fields

### 5. Review

- Review all settings before import
- See summary of what will be imported
- Final confirmation before proceeding

### 6. Progress

- Real-time progress indicator
- Shows success and failure counts
- Displays detailed error list if any failures occur

## API Endpoint

The import wizard uses the `/api/inventory/import` endpoint:

```typescript
POST /api/inventory/import

FormData:
  - data: Blob (JSON array of rows)
  - options: string (JSON stringified ImportOptions)

Response:
{
  successCount: number
  failedCount: number
  errors: ValidationError[]
  importLogId: string
}
```

## Validation Rules

- **Item Name**: 2-100 characters
- **Batch**: Alphanumeric with hyphens only, 3-50 characters
- **Quantity**: Positive integer, max 1,000,000
- **Reject**: Non-negative integer, cannot exceed quantity
- **Destination**: Must be exactly "MAIS" or "FOZAN"
- **Category**: Max 100 characters (optional)
- **Notes**: Max 5000 characters (optional)

## Error Handling

The system provides detailed error messages with:

- Row number where the error occurred
- Field name that has the error
- Current value
- Error message
- Suggestion for fixing (when applicable)

Common errors and suggestions:

- Non-numeric quantity → "Remove non-numeric characters"
- Invalid destination → "Use 'MAIS' or 'FOZAN' (all caps)"
- Invalid batch format → "Remove special characters"

## Permissions

Users must have the `inventory:write` permission to import data.

## Audit Trail

All import operations are logged with:

- User ID
- Timestamp
- Success/failure counts
- Import options used
- File name and size

## Performance

- Files up to 10 MB are supported
- Maximum 10,000 rows per import
- Large imports are processed in transactions
- Failed rows don't affect successful imports

## Accessibility

- Full keyboard navigation support
- ARIA labels for screen readers
- Focus management between steps
- Clear error messages and instructions
