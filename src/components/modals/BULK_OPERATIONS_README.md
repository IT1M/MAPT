# Bulk Operations System

This document describes the bulk operations system for inventory management, including bulk edit and bulk delete functionality.

## Overview

The bulk operations system allows users to perform actions on multiple inventory items simultaneously, with proper validation, progress tracking, audit logging, and error handling.

## Components

### 1. BulkEditModal

Enhanced bulk edit modal that supports multiple fields and modes.

**Features:**
- Field selection (destination, category, notes)
- Notes mode (replace or append)
- Preview of items to be updated
- Progress indicator
- Detailed result summary with success/failure counts
- Error reporting

**Usage:**
```tsx
import { BulkEditModal } from '@/components/modals'

const [bulkEditItems, setBulkEditItems] = useState<InventoryItemWithUser[]>([])
const [showBulkEdit, setShowBulkEdit] = useState(false)

// Open modal with selected items
const handleBulkEdit = () => {
  const selectedItems = items.filter(item => selectedIds.has(item.id))
  setBulkEditItems(selectedItems)
  setShowBulkEdit(true)
}

// Render modal
<BulkEditModal
  items={bulkEditItems}
  isOpen={showBulkEdit}
  onClose={() => setShowBulkEdit(false)}
  onSuccess={() => {
    refresh() // Refresh data
    setSelectedIds(new Set()) // Clear selection
    toast.success('Items updated successfully')
  }}
/>
```

### 2. BulkDeleteModal

Enhanced bulk delete modal with "DELETE" typing confirmation.

**Features:**
- Requires typing "DELETE" to confirm
- Shows item list with details
- Displays total quantity
- Progress indicator
- Detailed result summary
- Error reporting

**Usage:**
```tsx
import { BulkDeleteModal } from '@/components/modals'

const [bulkDeleteItems, setBulkDeleteItems] = useState<InventoryItemWithUser[]>([])
const [showBulkDelete, setShowBulkDelete] = useState(false)

// Open modal with selected items
const handleBulkDelete = () => {
  const selectedItems = items.filter(item => selectedIds.has(item.id))
  setBulkDeleteItems(selectedItems)
  setShowBulkDelete(true)
}

// Render modal
<BulkDeleteModal
  items={bulkDeleteItems}
  isOpen={showBulkDelete}
  onClose={() => setShowBulkDelete(false)}
  onSuccess={() => {
    refresh() // Refresh data
    setSelectedIds(new Set()) // Clear selection
    toast.success('Items deleted successfully')
  }}
/>
```

### 3. BulkActionsToolbar

Toolbar that appears when items are selected, providing quick access to bulk actions.

**Features:**
- Shows selected count
- Export, Edit, and Delete buttons
- Responsive design (dropdown on mobile)
- Permission-based button visibility
- Clear selection button

**Usage:**
```tsx
import { BulkActionsToolbar } from '@/components/tables'

<BulkActionsToolbar
  selectedCount={selectedIds.size}
  onBulkEdit={handleBulkEdit}
  onBulkEditDestination={handleBulkEditDestination}
  onBulkExport={handleBulkExport}
  onBulkDelete={handleBulkDelete}
  onClearSelection={() => setSelectedIds(new Set())}
  userPermissions={session?.user?.permissions || []}
/>
```

## API Endpoints

### POST /api/inventory/bulk-edit

Bulk edit inventory items with support for multiple fields and modes.

**Request Body:**
```json
{
  "ids": ["item-id-1", "item-id-2"],
  "updates": {
    "destination": "MAIS",
    "category": "Medical Supplies",
    "notes": "Updated via bulk edit",
    "notesMode": "append"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully updated 2 item(s)",
  "data": {
    "updatedCount": 2,
    "failedCount": 0,
    "errors": [],
    "auditLogIds": ["audit-1", "audit-2"]
  }
}
```

**Features:**
- Validates at least one field is provided
- Supports notes append mode
- Role-based filtering (DATA_ENTRY can only edit their own items)
- Individual item processing for proper error handling
- Audit logging for each update
- Detailed error reporting

### POST /api/inventory/bulk-delete

Bulk delete inventory items (soft delete).

**Request Body:**
```json
{
  "ids": ["item-id-1", "item-id-2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully deleted 2 item(s)",
  "data": {
    "deletedCount": 2,
    "failedCount": 0,
    "errors": [],
    "auditLogIds": ["audit-1", "audit-2"]
  }
}
```

**Features:**
- Requires SUPERVISOR or ADMIN role
- Soft delete (sets deletedAt timestamp)
- Individual item processing for proper error handling
- Audit logging for each deletion
- Detailed error reporting

## Permissions

### Bulk Edit
- Requires `inventory:write` permission
- DATA_ENTRY users can only edit items they created
- SUPERVISOR, MANAGER, and ADMIN can edit all items

### Bulk Delete
- Requires `inventory:delete` permission
- Only SUPERVISOR and ADMIN roles can delete
- DATA_ENTRY and MANAGER cannot delete

## Audit Logging

All bulk operations are fully audited:

- **Action Type**: UPDATE or DELETE
- **Entity**: InventoryItem
- **User**: User performing the action
- **Changes**: Before and after states
- **Metadata**: IP address, user agent, timestamp
- **Individual Logs**: One audit log per item

Audit logs can be viewed in:
- Audit log page (`/audit`)
- Item-specific audit history modal
- System-wide audit reports

## Error Handling

The system provides comprehensive error handling:

1. **Validation Errors**: Invalid input, missing fields
2. **Permission Errors**: Insufficient permissions, role restrictions
3. **Item-Level Errors**: Individual item failures don't stop the entire operation
4. **Detailed Reporting**: Each error includes item name, batch, and error message

## Best Practices

### 1. Always Refresh After Success
```tsx
onSuccess={() => {
  refresh() // Refresh data
  setSelectedIds(new Set()) // Clear selection
  toast.success('Operation completed')
}}
```

### 2. Limit Batch Size
The API enforces a maximum of 100 items per operation. For larger datasets:
- Process in batches
- Show progress indicator
- Allow cancellation

### 3. Provide Clear Feedback
```tsx
// Before operation
toast.loading('Updating items...')

// After success
toast.success(`Updated ${count} items`)

// After partial failure
toast.warning(`Updated ${success} items, ${failed} failed`)

// After complete failure
toast.error('Failed to update items')
```

### 4. Handle Permissions Gracefully
```tsx
const canDelete = session?.user?.permissions?.includes('inventory:delete')
const canBulkDelete = canDelete && ['SUPERVISOR', 'ADMIN'].includes(session?.user?.role)

{canBulkDelete && (
  <Button onClick={handleBulkDelete}>Delete</Button>
)}
```

## Complete Integration Example

```tsx
'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { BulkActionsToolbar } from '@/components/tables'
import { BulkEditModal, BulkDeleteModal } from '@/components/modals'
import { InventoryTable } from '@/components/tables'
import { toast } from '@/utils/toast'

export default function DataLogPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<InventoryItemWithUser[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // Bulk edit state
  const [bulkEditItems, setBulkEditItems] = useState<InventoryItemWithUser[]>([])
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  
  // Bulk delete state
  const [bulkDeleteItems, setBulkDeleteItems] = useState<InventoryItemWithUser[]>([])
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  
  const handleBulkEdit = () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id))
    if (selectedItems.length === 0) {
      toast.error('No items selected')
      return
    }
    setBulkEditItems(selectedItems)
    setShowBulkEdit(true)
  }
  
  const handleBulkDelete = () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id))
    if (selectedItems.length === 0) {
      toast.error('No items selected')
      return
    }
    setBulkDeleteItems(selectedItems)
    setShowBulkDelete(true)
  }
  
  const handleBulkSuccess = () => {
    // Refresh data
    fetchData()
    // Clear selection
    setSelectedIds(new Set())
  }
  
  return (
    <div>
      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds.size}
          onBulkEdit={handleBulkEdit}
          onBulkEditDestination={() => {/* ... */}}
          onBulkExport={() => {/* ... */}}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => setSelectedIds(new Set())}
          userPermissions={session?.user?.permissions || []}
        />
      )}
      
      {/* Inventory Table */}
      <InventoryTable
        items={items}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        userPermissions={session?.user?.permissions || []}
      />
      
      {/* Bulk Edit Modal */}
      <BulkEditModal
        items={bulkEditItems}
        isOpen={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        onSuccess={handleBulkSuccess}
      />
      
      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        items={bulkDeleteItems}
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onSuccess={handleBulkSuccess}
      />
    </div>
  )
}
```

## Testing

### Manual Testing Checklist

- [ ] Select multiple items
- [ ] Bulk edit with destination only
- [ ] Bulk edit with category only
- [ ] Bulk edit with notes (replace mode)
- [ ] Bulk edit with notes (append mode)
- [ ] Bulk edit with multiple fields
- [ ] Bulk delete with confirmation
- [ ] Bulk delete without typing DELETE (should fail)
- [ ] Test with DATA_ENTRY user (can only edit own items)
- [ ] Test with SUPERVISOR user (can edit and delete all)
- [ ] Test with items from different users
- [ ] Verify audit logs are created
- [ ] Test error handling (network failure, permission denied)
- [ ] Test progress indicators
- [ ] Test result summaries
- [ ] Test mobile responsive design

### API Testing

```bash
# Bulk edit
curl -X POST http://localhost:3000/api/inventory/bulk-edit \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["item-1", "item-2"],
    "updates": {
      "destination": "MAIS",
      "category": "Medical",
      "notes": "Updated",
      "notesMode": "append"
    }
  }'

# Bulk delete
curl -X POST http://localhost:3000/api/inventory/bulk-delete \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["item-1", "item-2"]
  }'
```

## Troubleshooting

### Issue: "You can only update items you created"
**Solution**: DATA_ENTRY users can only edit their own items. Use a SUPERVISOR or ADMIN account, or filter selection to only include items created by the current user.

### Issue: "Only supervisors and administrators can delete"
**Solution**: Bulk delete requires SUPERVISOR or ADMIN role. DATA_ENTRY and MANAGER users cannot delete items.

### Issue: Progress bar not updating
**Solution**: The current implementation shows progress at 0% and 100%. For real-time progress, implement server-sent events or polling.

### Issue: Audit logs not created
**Solution**: Check that the audit service is properly configured and the database has the audit_logs table.

## Future Enhancements

1. **Real-time Progress**: Implement SSE or WebSocket for real-time progress updates
2. **Undo Functionality**: Allow users to undo bulk operations
3. **Scheduled Operations**: Schedule bulk operations for later execution
4. **Export Before Delete**: Automatically export items before bulk delete
5. **Bulk Import**: Import updates from CSV/Excel files
6. **Advanced Validation**: Custom validation rules per field
7. **Batch Processing**: Process very large datasets in background jobs
8. **Notification**: Email notifications for completed bulk operations
