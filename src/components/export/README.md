# Export Components

This directory contains components for exporting data in various formats.

## ExportButton Component

A comprehensive export button with dropdown menu for exporting data to CSV, JSON, Excel, and PDF formats.

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
