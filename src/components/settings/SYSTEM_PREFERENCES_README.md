# System Preferences Implementation

This document describes the implementation of Task 8: Build system preferences (Admin/Manager).

## Overview

The System Preferences section provides Admin and Manager users with the ability to configure system-wide settings including company information, inventory settings, backup configuration, system limits, and developer settings.

## Components

### 1. CompanyInfo Component
**Location**: `src/components/settings/CompanyInfo.tsx`

**Features**:
- Company name configuration
- Logo upload with preview (supports JPG, PNG, WEBP up to 5MB)
- Fiscal year start month selector
- Timezone selector (using Intl.supportedValuesOf)
- Auto-save with validation
- Success/error feedback

**Requirements**: 17.2, 17.3, 17.4

### 2. InventorySettings Component
**Location**: `src/components/settings/InventorySettings.tsx`

**Features**:
- Default destination selector (MAIS/FOZAN)
- Enable/disable categories
- Predefined categories management (add/remove tags)
- Auto-generate batch numbers toggle
- Batch number pattern configuration (e.g., BATCH-{YYYY}-{####})
- Supervisor approval toggle
- Approval threshold configuration
- Real-time validation

**Requirements**: 17.2, 17.3, 17.4

### 3. BackupConfig Component
**Location**: `src/components/settings/BackupConfig.tsx`

**Features**:
- Enable/disable daily automatic backups
- Backup time selector (24-hour format)
- Retention period configuration (1-365 days)
- Backup format selection (CSV, JSON, SQL)
- Last backup status display
- Validation for time format and retention period

**Requirements**: 18.1, 18.2

### 4. SystemLimits Component
**Location**: `src/components/settings/SystemLimits.tsx`

**Features**:
- Max items per user per day (1-10,000)
- Max file upload size in MB (1-100)
- Session timeout in minutes (5-1440)
- Max login attempts (1-10)
- API rate limit per minute (10-1000)
- Range validation for all limits
- Immediate application of new limits

**Requirements**: 19.2, 19.4

### 5. DeveloperSettings Component
**Location**: `src/components/settings/DeveloperSettings.tsx`

**Features**:
- Debug mode toggle
- Log level selector (error, warning, info, debug)
- API rate limits configuration (per minute and per hour)
- Export system logs functionality
- Admin-only access control
- Warning message about advanced settings

**Requirements**: 25.1, 25.2, 25.5

### 6. SystemPreferences Component
**Location**: `src/components/settings/SystemPreferences.tsx`

**Features**:
- Tabbed interface for different settings sections
- Role-based access control (Admin/Manager)
- Responsive tab navigation
- Icon-based tabs for better UX
- Developer tab only visible to Admin users

## API Endpoints

### Enhanced GET /api/settings
**Location**: `src/app/api/settings/route.ts`

**Enhancements**:
- Added support for new setting keys:
  - Company: company_name, company_logo, fiscal_year_start, timezone
  - Inventory: categories_enabled, predefined_categories, auto_batch_numbers, batch_number_pattern, supervisor_approval, approval_threshold
  - Backup: backup_enabled, backup_time, backup_format, last_backup_timestamp, last_backup_status
  - System Limits: max_items_per_user_per_day, max_file_upload_size_mb
  - Developer: debug_mode, log_level, api_rate_limit_per_minute, api_rate_limit_per_hour
- Validation for all new settings
- Proper categorization of settings

### Enhanced PATCH /api/settings
**Location**: `src/app/api/settings/route.ts`

**Enhancements**:
- Validation for all new setting types
- Audit logging for all changes
- Proper error handling
- Category assignment based on key prefixes

### NEW: GET /api/settings/logs/export
**Location**: `src/app/api/settings/logs/export/route.ts`

**Features**:
- Export last 1000 audit log entries
- Include user information for each log entry
- System statistics (user count, inventory count, etc.)
- Activity summary (last 24 hours)
- System settings dump (with sensitive values masked)
- Text file format for easy viewing
- Admin-only access
- Automatic filename with date

**Requirements**: 25.5

## Data Flow

1. **Component Mount**:
   - Fetch current settings from `/api/settings`
   - Parse settings by category
   - Populate form with current values

2. **User Input**:
   - Update local state
   - Clear field-specific errors
   - Clear success messages

3. **Form Submission**:
   - Validate using Zod schemas
   - Display validation errors if any
   - Convert to settings format
   - Send PATCH request to `/api/settings`
   - Handle success/error responses
   - Display feedback to user

4. **Logs Export**:
   - Send GET request to `/api/settings/logs/export`
   - Receive text file
   - Trigger browser download
   - Display success message

## Validation

All components use Zod schemas from `src/utils/settings-validation.ts`:

- `companyInfoSchema`: Validates company information
- `inventorySettingsSchema`: Validates inventory configuration
- `backupConfigSchema`: Validates backup settings
- `systemLimitsSchema`: Validates system limits
- `developerSettingsSchema`: Validates developer settings

## Access Control

### Admin Users
- Full access to all system preferences
- Can view and modify all settings
- Can access developer settings
- Can export system logs

### Manager Users
- Access to company info, inventory, backup, and system limits
- Cannot access developer settings
- Cannot export system logs

### Other Roles
- No access to system preferences
- Appropriate error message displayed

## Styling

All components follow the existing design system:
- Consistent form layouts
- Dark mode support
- Responsive design
- Accessible form controls
- Clear error/success messaging
- Loading states

## Error Handling

1. **Network Errors**: Display error toast with retry option
2. **Validation Errors**: Show inline field errors
3. **Permission Errors**: Show access denied message
4. **Server Errors**: Display error message with details

## Testing

To test the implementation:

1. **As Admin**:
   ```bash
   # Login as admin user
   # Navigate to Settings > System Preferences
   # Test each tab:
   # - Company Info: Upload logo, change timezone
   # - Inventory: Add categories, configure batch numbers
   # - Backup: Enable backups, set schedule
   # - System Limits: Adjust limits
   # - Developer: Toggle debug mode, export logs
   ```

2. **As Manager**:
   ```bash
   # Login as manager user
   # Navigate to Settings > System Preferences
   # Verify Developer tab is not visible
   # Test accessible tabs
   ```

3. **As Other Role**:
   ```bash
   # Login as data entry or auditor
   # Verify System Preferences is not accessible
   ```

## Integration

To integrate into the main settings page:

```typescript
import { SystemPreferences } from '@/components/settings'

// In your settings page component
<SystemPreferences />
```

The component handles all routing, access control, and state management internally.

## Future Enhancements

1. **Real-time Settings Sync**: Use WebSockets to sync settings across sessions
2. **Settings History**: Track and display history of setting changes
3. **Settings Templates**: Save and load setting configurations
4. **Bulk Settings Import/Export**: Import/export all settings as JSON
5. **Settings Validation Rules**: More complex validation rules
6. **Settings Dependencies**: Automatically enable/disable related settings
7. **Settings Search**: Search across all system settings
8. **Settings Comparison**: Compare current vs default settings

## Troubleshooting

### Settings Not Saving
- Check browser console for errors
- Verify user has Admin/Manager role
- Check network tab for API response
- Verify validation passes

### Logo Upload Fails
- Check file size (max 5MB)
- Verify file type (JPG, PNG, WEBP)
- Check browser console for errors

### Logs Export Fails
- Verify user has Admin role
- Check browser console for errors
- Verify API endpoint is accessible

## Related Files

- Types: `src/types/settings.ts`
- Validation: `src/utils/settings-validation.ts`
- API: `src/app/api/settings/route.ts`
- Logs Export: `src/app/api/settings/logs/export/route.ts`
- Components: `src/components/settings/`

## Requirements Coverage

- ✅ 17.2: Company information fields
- ✅ 17.3: Inventory settings
- ✅ 17.4: Backup settings
- ✅ 18.1: Backup configuration toggle
- ✅ 18.2: Backup time and retention
- ✅ 19.2: System limits inputs
- ✅ 19.4: System limits validation
- ✅ 25.1: Developer settings access
- ✅ 25.2: Debug mode and log level
- ✅ 25.5: Export system logs
