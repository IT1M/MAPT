# User Management Components

This directory contains comprehensive user management components for the settings interface, implementing task 4 of the settings-interface spec.

## Components

### UserManagement
Main container component that orchestrates all user management functionality.

**Usage:**
```tsx
import { UserManagement } from '@/components/settings'

export default function SettingsPage() {
  const { data: session } = useSession()
  
  return (
    <UserManagement currentUserId={session?.user?.id || ''} />
  )
}
```

**Features:**
- Fetches and displays all users
- Handles user creation, editing, and deletion
- Manages bulk operations
- Shows role permissions matrix
- Integrates all sub-components

### UserTable
Displays users in a sortable, filterable, paginated table.

**Features:**
- Search by name or email
- Filter by role
- Sort by name, email, role, or last login
- Pagination (25 users per page)
- Bulk selection with checkboxes
- Status toggle (active/inactive)
- Inline edit and delete actions
- Prevents operations on current user
- Visual distinction for current user and inactive users

### UserModal
Modal dialog for creating and editing users.

**Features:**
- Create/edit mode
- Auto-generate secure passwords
- Password visibility toggle
- Copy password to clipboard
- Real-time form validation
- Role selection with descriptions
- Active status toggle
- Welcome email option (create only)
- Password requirements display

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character (!@#$%^&*)

### RolePermissionsMatrix
Read-only display of permissions for each role.

**Features:**
- Grouped by category (Inventory, Analytics, Reports, Administration, Security, Data)
- Visual checkmarks/crosses for permissions
- Color-coded role badges
- Accessible to screen readers
- Responsive design

**Permission Categories:**
- **Inventory:** Add, Edit, Delete
- **Analytics:** View Analytics
- **Reports:** Generate Reports
- **Administration:** Manage Users, System Settings
- **Security:** View Audit Logs
- **Data:** Export Data

### BulkUserActions
Toolbar for performing operations on multiple selected users.

**Features:**
- Activate/Deactivate users
- Change role for multiple users
- Delete multiple users
- Confirmation dialogs for destructive actions
- Operation result feedback (success/failed counts)
- Prevents operations on current user
- Clear selection option

## API Endpoints

### GET /api/users
List all users (Admin only)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "DATA_ENTRY",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/users
Create a new user (Admin only)

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "DATA_ENTRY",
  "isActive": true,
  "sendWelcomeEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "DATA_ENTRY",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/users/[id]
Update a user (Admin only)

**Request:**
```json
{
  "name": "John Doe Updated",
  "role": "SUPERVISOR",
  "password": "NewPassword123!" // Optional
}
```

### DELETE /api/users/[id]
Delete a user (Admin only)

**Note:** Cannot delete your own account

### PATCH /api/users/[id]/status
Update user active status (Admin only)

**Request:**
```json
{
  "isActive": false
}
```

**Note:** 
- Deactivating a user terminates all their sessions
- Cannot change your own status

### POST /api/users/bulk-action
Perform bulk operations (Admin only)

**Actions:**
- `activate`: Activate multiple users
- `deactivate`: Deactivate multiple users (terminates sessions)
- `changeRole`: Change role for multiple users
- `delete`: Delete multiple users

**Request (activate/deactivate):**
```json
{
  "action": "activate",
  "userIds": ["user_id_1", "user_id_2"]
}
```

**Request (changeRole):**
```json
{
  "action": "changeRole",
  "userIds": ["user_id_1", "user_id_2"],
  "data": {
    "role": "SUPERVISOR"
  }
}
```

**Request (delete):**
```json
{
  "action": "delete",
  "userIds": ["user_id_1", "user_id_2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "action": "activate",
    "affectedCount": 2,
    "userIds": ["user_id_1", "user_id_2"]
  },
  "message": "Successfully activated 2 user(s)"
}
```

## Email Functionality

### Welcome Email
Sent when creating a new user with `sendWelcomeEmail: true`

**Content:**
- Welcome message
- Login credentials (email and temporary password)
- Login URL
- Instructions to change password

**Implementation:**
The email utility (`src/utils/email.ts`) provides a placeholder implementation that logs emails in development. In production, integrate with your email service (SendGrid, AWS SES, Resend, etc.).

**Configuration:**
Set `SMTP_*` environment variables or integrate with your preferred email service.

## Audit Logging

All user management operations are logged to the audit log:

- User creation
- User updates (including field changes)
- User deletion
- Status changes (activate/deactivate)
- Bulk operations

**Audit Log Fields:**
- `userId`: Admin who performed the action
- `action`: CREATE, UPDATE, DELETE
- `entity`: "User"
- `entityId`: Affected user ID
- `changes`: Before/after values
- `metadata`: IP address, user agent, additional context

## Security Features

1. **Role-Based Access Control**
   - Only ADMIN role can access user management
   - Server-side permission checks on all endpoints
   - Client-side UI hiding for non-admins

2. **Self-Protection**
   - Cannot delete your own account
   - Cannot change your own status
   - Cannot perform bulk operations on yourself

3. **Session Management**
   - Deactivating a user terminates all their sessions
   - Bulk deactivate terminates sessions for all affected users

4. **Password Security**
   - Passwords hashed with bcrypt (12 rounds)
   - Strong password requirements enforced
   - Auto-generated passwords meet all requirements

5. **Audit Trail**
   - All operations logged with user, timestamp, and changes
   - IP address and user agent captured
   - Bulk operations tracked individually

## Accessibility

- Full keyboard navigation
- ARIA labels and roles
- Screen reader announcements
- Focus management in modals
- Semantic HTML
- Color contrast compliance (WCAG AA)
- Touch target sizes (44x44px minimum)

## Responsive Design

- Mobile-friendly table (horizontal scroll with indicators)
- Responsive filters (stack on mobile)
- Touch-optimized controls
- Adaptive pagination controls

## Integration Example

Replace the existing user management section in `src/app/[locale]/settings/page.tsx`:

```tsx
'use client'

import { useSession } from 'next-auth/react'
import { UserManagement } from '@/components/settings'

export default function SettingsPage() {
  const { data: session } = useSession()
  
  // Check if user is admin
  const isAdmin = session?.user?.permissions?.includes('users:manage')
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <p>You don't have permission to access user management.</p>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <UserManagement currentUserId={session.user.id} />
    </div>
  )
}
```

## Testing

To test the user management functionality:

1. **Login as Admin**
   - Ensure your user has the ADMIN role

2. **Create a User**
   - Click "Add New User"
   - Fill in the form
   - Try auto-generating a password
   - Enable "Send welcome email" (check console in dev)
   - Submit and verify user appears in table

3. **Edit a User**
   - Click "Edit" on any user
   - Modify fields
   - Submit and verify changes

4. **Toggle Status**
   - Click the status badge to activate/deactivate
   - Verify status changes and sessions are terminated

5. **Bulk Operations**
   - Select multiple users (not yourself)
   - Try activate, deactivate, change role, and delete
   - Verify confirmation dialogs
   - Check operation results

6. **Permissions Matrix**
   - Click "Show Permissions"
   - Verify all roles and permissions display correctly

7. **Search and Filter**
   - Search by name or email
   - Filter by role
   - Sort by different columns
   - Navigate pagination

## Requirements Covered

This implementation covers the following requirements from the spec:

- **7.3, 7.4, 7.5:** User list with search, filter, and role-based access
- **8.2, 8.3, 8.4, 8.5:** User creation/editing with validation and welcome email
- **9.2, 9.3, 9.4:** Status management with session termination
- **10.2, 10.3, 10.4, 10.5:** Bulk operations with confirmation and results
- **11.1, 11.2:** Role permissions matrix display
- **16.3:** Audit logging for all operations

## Future Enhancements

- Virtual scrolling for large user lists (>1000 users)
- Advanced filters (created date, last login, etc.)
- Export user list to CSV
- User activity dashboard
- Password reset functionality
- Two-factor authentication management
- Custom role creation
- Granular permission management
