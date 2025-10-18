# Export System

This directory contains a comprehensive export system with support for CSV, Excel, JSON, and PDF formats, including audit logging, email delivery for large exports, and export history tracking.

## Components

### ExportButton Component

A comprehensive export button with dropdown menu for exporting data to CSV, JSON, Excel, and PDF formats.

### ExportModal Component

An advanced export modal with column selection, filename customization, filter inclusion, and progress tracking.

### ExportHistory Component

A component to view export history with details about past exports including format, record count, file size, and timestamp.

### Features

- **CSV Export**: Client-side CSV generation with UTF-8 BOM for Excel compatibility
- **JSON Export**: Includes metadata (export date, filters, record count)
- **Excel Export**: Server-side formatted spreadsheet with formulas and totals
- **PDF Export**: Server-side professional report with company header and orientation options
- **Progress Indicator**: Shows export progress percentage
- **Smart Data Selection**: Exports selected items or all filtered data
- **File Size Display**: Shows file size after successful export
- **Error Handling**: Graceful error handling with user feedback and retry options
- **Rate Limiting**: Server-side exports are rate-limited (10 exports per 15 minutes)

### Usage

```tsx
import { ExportButton } from '@/components/export'

function MyComponent() {
  const [data, setData] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [filters, setFilters] = useState({})

  return (
    <ExportButton
      data={data}
      filename="inventory-export"
      selectedIds={selectedIds}
      filters={filters}
      onExport={(format, success, fileSize) => {
        if (success) {
          console.log(`${format} export successful (${fileSize?.toFixed(2)} KB)`)
        } else {
          console.error(`${format} export failed`)
        }
      }}
    />
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `any[]` | Required | Array of data to export |
| `filename` | `string` | `'inventory-export'` | Base filename for exported files |
| `selectedIds` | `Set<string>` | `undefined` | Set of selected item IDs (exports only selected if provided) |
| `filters` | `Record<string, any>` | `undefined` | Current filter state (included in JSON metadata) |
| `onExport` | `(format, success, fileSize?) => void` | `undefined` | Callback fired after export attempt with optional file size in KB |
| `className` | `string` | `''` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disable the export button |

### Export Formats

#### CSV Format (Client-side)
- UTF-8 with BOM encoding for Excel compatibility
- All object keys as headers
- Nested objects flattened (e.g., user.name)
- Proper quote escaping
- Date-stamped filename

#### JSON Format (Client-side)
- Includes metadata object with:
  - Export date (ISO format)
  - Total record count
  - Applied filters
  - Whether only selected items were exported
- Pretty-printed with 2-space indentation
- Date-stamped filename

#### Excel Format (Server-side)
- Formatted spreadsheet with bold headers and colored backgrounds
- Auto-column width based on content
- Summary section with totals and statistics
- Formulas for calculations
- Multiple sheets for large datasets
- Professional formatting
- Requires API endpoint: `POST /api/inventory/export/excel`

#### PDF Format (Server-side)
- Professional report layout with company header
- Page numbers and footer
- Filter information display
- Summary statistics section
- Orientation options (landscape/portrait)
- Landscape recommended for wide tables
- Portrait for detailed reports
- Requires API endpoint: `POST /api/inventory/export/pdf`

### Accessibility

- Keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader announcements

### Notes

- CSV and JSON exports are client-side (no server request)
- Excel and PDF exports are server-side (require API endpoints)
- Server-side exports are rate-limited to prevent abuse
- Handles large datasets efficiently
- Automatic file download via blob URLs
- Memory cleanup after download
- Error messages displayed inline in dropdown
- Progress indicator for all export types

### API Requirements

For Excel and PDF exports to work, the following API endpoints must be available:

- `POST /api/inventory/export/excel` - Excel export endpoint
- `POST /api/inventory/export/pdf` - PDF export endpoint

Both endpoints expect a JSON payload with:
```json
{
  "filters": { /* filter state */ },
  "ids": ["id1", "id2"], // optional, for selected items
  "options": { /* format-specific options */ }
}
```

### Error Handling

The component handles various error scenarios:
- Network failures
- Rate limit exceeded (429 status)
- Server errors (5xx status)
- Invalid data
- Empty datasets

Errors are displayed inline in the dropdown with a dismiss button.


## Universal Export API

### POST /api/export

Universal export endpoint supporting multiple entities and formats.

**Request Body:**
```json
{
  "format": "csv" | "excel" | "json" | "pdf",
  "entity": "inventory" | "audit" | "reports" | "users",
  "filters": { /* entity-specific filters */ },
  "ids": ["id1", "id2"], // optional, for selected items
  "columns": ["column1", "column2"], // optional, specific columns
  "filename": "my-export", // optional, custom filename
  "includeFilters": true, // optional, include filter info in export
  "emailDelivery": false // optional, force email delivery
}
```

**Response:**
- For small exports (<5000 records): File download
- For large exports (>5000 records): Email delivery confirmation

**Features:**
- Rate limiting: 10 exports per 15 minutes
- Automatic email delivery for large datasets
- Audit logging for all exports
- Role-based access control
- Column selection
- Filter inclusion in metadata

### GET /api/export/history

Get export history for the current user.

**Query Parameters:**
- `limit`: Number of records to return (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "export_123",
      "format": "excel",
      "recordCount": 1500,
      "fileSize": 245760,
      "filters": { /* applied filters */ },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 25
}
```

## Export Service

The export service (`src/services/export.ts`) provides utility functions for generating exports:

### Functions

#### `exportToCSV(options: ExportOptions): Promise<Buffer>`
Generates a CSV file with UTF-8 BOM for Excel compatibility.

#### `exportToExcel(options: ExportOptions): Promise<Buffer>`
Generates an Excel file with formatting, summary section, and auto-sized columns.

#### `exportToJSON(options: ExportOptions): Promise<Buffer>`
Generates a JSON file with metadata including export date, filters, and record count.

#### `logExport(params): Promise<void>`
Logs export activity to the audit trail.

#### `getExportHistory(userId: string, limit?: number): Promise<ExportHistoryEntry[]>`
Retrieves export history for a user.

#### `emailExport(params): Promise<void>`
Sends an export file via email with the file attached.

#### `shouldEmailExport(recordCount: number, threshold?: number): boolean`
Determines if an export should be emailed based on record count (default threshold: 5000).

## Usage Examples

### Using ExportModal

```tsx
import { ExportModal } from '@/components/export'

function MyComponent() {
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filters, setFilters] = useState({})

  return (
    <>
      <button onClick={() => setShowExportModal(true)}>
        Export Data
      </button>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        entity="inventory"
        filters={filters}
        selectedIds={selectedIds}
        onExportComplete={(success, format) => {
          if (success) {
            console.log(`Export completed: ${format}`)
          }
        }}
      />
    </>
  )
}
```

### Using ExportHistory

```tsx
import { ExportHistory } from '@/components/export'

function SettingsPage() {
  return (
    <div>
      <h2>Export History</h2>
      <ExportHistory />
    </div>
  )
}
```

### Direct API Usage

```typescript
// Export with custom options
const response = await fetch('/api/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    format: 'excel',
    entity: 'inventory',
    filters: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      destination: 'MAIS'
    },
    columns: ['itemName', 'batch', 'quantity', 'reject'],
    filename: 'january-inventory',
    includeFilters: true
  })
})

if (response.ok) {
  const blob = await response.blob()
  // Handle download
}
```

## Email Delivery

For exports exceeding 5000 records, the system automatically sends the export file via email:

1. User initiates export
2. System detects large dataset
3. Export is generated in background
4. Email is sent with file attached
5. User receives notification

The email includes:
- Export filename
- Format
- Record count
- File size
- Attached export file

## Audit Logging

All exports are logged to the audit trail with:
- User ID
- Timestamp
- Format
- Record count
- File size
- Applied filters
- Entity type

View export history:
- In the UI: Use the `ExportHistory` component
- Via API: `GET /api/export/history`

## Security Features

- **Rate Limiting**: 10 exports per 15 minutes per user
- **Permission Checks**: Role-based access control for each entity
- **Data Filtering**: Users only see data they have permission to access
- **Audit Trail**: All exports are logged for compliance
- **Secure Delivery**: Email attachments for large exports

## Performance Considerations

- **Client-side exports** (CSV, JSON): Fast, no server load, limited by browser memory
- **Server-side exports** (Excel, PDF): Better for large datasets, formatted output
- **Email delivery**: Automatic for >5000 records, prevents browser timeouts
- **Streaming**: Large files are streamed to prevent memory issues

## Supported Entities

- **inventory**: Inventory items with quantities, rejects, and metadata
- **audit**: Audit log entries with user actions and changes
- **reports**: Generated reports with status and metadata
- **users**: User accounts with roles and activity (admin only)

Each entity has specific columns and filters appropriate to its data structure.
