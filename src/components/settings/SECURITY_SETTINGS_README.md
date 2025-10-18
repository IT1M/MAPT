# Security Settings Implementation

This document describes the security settings components and API endpoints implemented for task 3.

## Components

### 1. PasswordChangeForm
**Location**: `src/components/settings/PasswordChangeForm.tsx`

A form component for changing user passwords with real-time validation and strength indicator.

**Features**:
- Current password verification
- New password validation with requirements
- Password strength indicator (0-4 scale)
- Show/hide password toggles
- Real-time feedback on password requirements
- Auto-save on successful change

**Props**:
```typescript
interface PasswordChangeFormProps {
  onSubmit: (data: PasswordChangeData) => Promise<void>
}

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
```

**Usage**:
```tsx
<PasswordChangeForm
  onSubmit={async (data) => {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    })
    // Handle response
  }}
/>
```

### 2. SessionCard
**Location**: `src/components/settings/SessionCard.tsx`

Displays information about a single user session with device/browser details.

**Features**:
- Device icon based on device type
- Browser and OS information
- IP address and location
- Last active timestamp
- Current session badge
- Sign out button (disabled for current session)

**Props**:
```typescript
interface SessionCardProps {
  session: UserSession
  onTerminate: (sessionId: string) => Promise<void>
  isTerminating?: boolean
}

interface UserSession {
  id: string
  device?: string
  browser?: string
  os?: string
  ipAddress?: string
  location?: string
  lastActive: Date
  isCurrent: boolean
  userAgent?: string
}
```

### 3. SessionManager
**Location**: `src/components/settings/SessionManager.tsx`

Manages all active sessions for the current user.

**Features**:
- List all active sessions
- Highlight current session
- Terminate individual sessions
- Bulk terminate all other sessions
- Confirmation dialog for bulk actions
- Auto-refresh after termination

**Props**:
```typescript
interface SessionManagerProps {
  sessions: UserSession[]
  currentSessionId: string
  onTerminate: (sessionId: string) => Promise<void>
  onTerminateAll: () => Promise<void>
  onRefresh?: () => Promise<void>
}
```

### 4. SecurityAuditLog
**Location**: `src/components/settings/SecurityAuditLog.tsx`

Displays security-related events for the current user with pagination and export.

**Features**:
- Paginated event list
- Event type icons and colors
- IP address and location display
- Export to CSV
- Loading states
- Empty state

**Props**:
```typescript
interface SecurityAuditLogProps {
  userId: string
  events: SecurityEvent[]
  totalEvents: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onExport: () => Promise<void>
  isLoading?: boolean
}

interface SecurityEvent {
  id: string
  type: 'login' | 'failed_login' | 'password_change' | 'session_terminated'
  timestamp: Date
  ipAddress: string
  location?: string
  success: boolean
  userAgent?: string
}
```

### 5. SecuritySettings
**Location**: `src/components/settings/SecuritySettings.tsx`

Main container component that combines all security settings sections.

**Features**:
- Password change section
- Session management section
- Security audit log section
- Organized layout with sections

**Props**:
```typescript
interface SecuritySettingsProps {
  userId: string
  sessions: UserSession[]
  currentSessionId: string
  securityEvents: SecurityEvent[]
  totalEvents: number
  currentPage: number
  pageSize: number
  onPasswordChange: (data: PasswordChangeData) => Promise<void>
  onSessionTerminate: (sessionId: string) => Promise<void>
  onSessionTerminateAll: () => Promise<void>
  onSessionsRefresh: () => Promise<void>
  onPageChange: (page: number) => void
  onExportLog: () => Promise<void>
}
```

## Utilities

### 1. Password Utilities
**Location**: `src/utils/password.ts`

**Functions**:
- `calculatePasswordStrength(password: string)`: Calculate password strength (0-4)
- `validatePassword(password: string)`: Validate against requirements
- `generatePassword(length?: number)`: Generate secure random password
- `passwordsMatch(password: string, confirmPassword: string)`: Check if passwords match

**Password Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

### 2. User-Agent Parser
**Location**: `src/utils/user-agent.ts`

**Functions**:
- `parseUserAgent(userAgent: string)`: Parse user-agent string
- `formatUserAgent(parsed: ParsedUserAgent)`: Format parsed data
- `getDeviceIcon(deviceType: string)`: Get emoji icon for device type

**Parsed Information**:
- Browser name and version
- Operating system and version
- Device type (desktop, mobile, tablet)
- Device name

## API Endpoints

### 1. Change Password
**Endpoint**: `POST /api/auth/change-password`

**Request Body**:
```json
{
  "oldPassword": "current_password",
  "newPassword": "new_password"
}
```

**Response**:
```json
{
  "success": true,
  "data": { "message": "Password changed successfully" },
  "message": "Your password has been updated..."
}
```

**Features**:
- Rate limiting (5 attempts per hour per user)
- Current password verification
- Password validation
- Audit log creation
- Session invalidation hint

### 2. Get Sessions
**Endpoint**: `GET /api/auth/sessions`

**Response**:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_id",
        "isCurrent": true,
        "lastActive": "2024-01-01T00:00:00Z",
        "device": "Desktop",
        "browser": "Chrome",
        "ipAddress": "192.168.1.1",
        "location": null,
        "userAgent": "Mozilla/5.0..."
      }
    ],
    "currentSessionId": "session_id"
  }
}
```

### 3. Delete All Other Sessions
**Endpoint**: `DELETE /api/auth/sessions`

**Response**:
```json
{
  "success": true,
  "data": {
    "deletedCount": 3
  },
  "message": "Successfully signed out of 3 other session(s)"
}
```

### 4. Delete Specific Session
**Endpoint**: `DELETE /api/auth/sessions/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "session_id"
  },
  "message": "Session terminated successfully"
}
```

### 5. Get Security Log
**Endpoint**: `GET /api/auth/security-log?page=1&limit=10`

**Response**:
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event_id",
        "type": "login",
        "timestamp": "2024-01-01T00:00:00Z",
        "ipAddress": "192.168.1.1",
        "location": null,
        "success": true,
        "userAgent": "Mozilla/5.0..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 6. Export Security Log
**Endpoint**: `GET /api/auth/security-log/export`

**Response**: CSV file download

**CSV Format**:
```csv
Timestamp,Event Type,IP Address,User Agent
2024-01-01 12:00:00,login,192.168.1.1,Mozilla/5.0...
```

## Rate Limiting

The password change endpoint has strict rate limiting:
- **Limit**: 5 attempts per hour per user
- **Window**: 1 hour (3600 seconds)
- **Key**: Session token or IP address
- **Response**: 429 Too Many Requests with Retry-After header

## Security Considerations

1. **Password Storage**: Passwords are hashed with bcrypt (12 rounds)
2. **Session Management**: Sessions are stored in database with expiry
3. **Audit Logging**: All security events are logged with IP and user-agent
4. **Rate Limiting**: Prevents brute force attacks on password changes
5. **Current Session Protection**: Cannot terminate current session via API
6. **Authorization**: All endpoints require authentication
7. **Validation**: Server-side validation for all inputs

## Future Enhancements

1. **Session Tracking**: Extend Session model to store device/browser/IP/location
2. **Failed Login Tracking**: Track and display failed login attempts
3. **Two-Factor Authentication**: Add 2FA support
4. **Session Notifications**: Email notifications for new sessions
5. **Suspicious Activity Detection**: Alert on unusual login patterns
6. **IP Geolocation**: Add location lookup for IP addresses
7. **Device Management**: Allow naming/managing trusted devices

## Testing

To test the security settings:

1. **Password Change**:
   - Try changing password with incorrect current password
   - Try weak passwords (should show strength indicator)
   - Try mismatched passwords
   - Successfully change password

2. **Session Management**:
   - Log in from multiple devices/browsers
   - View all active sessions
   - Terminate individual sessions
   - Terminate all other sessions

3. **Security Log**:
   - View security events
   - Navigate through pages
   - Export log to CSV
   - Verify event types and timestamps

4. **Rate Limiting**:
   - Attempt password change 6 times in quick succession
   - Verify 429 response on 6th attempt
   - Wait 1 hour and try again

## Integration Example

```tsx
'use client'

import { useState, useEffect } from 'react'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export default function SecurityPage() {
  const { data: session } = useSession()
  const [sessions, setSessions] = useState([])
  const [events, setEvents] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalEvents, setTotalEvents] = useState(0)

  // Fetch sessions
  const fetchSessions = async () => {
    const response = await fetch('/api/auth/sessions')
    const data = await response.json()
    if (data.success) {
      setSessions(data.data.sessions)
    }
  }

  // Fetch security events
  const fetchEvents = async (page: number) => {
    const response = await fetch(`/api/auth/security-log?page=${page}&limit=10`)
    const data = await response.json()
    if (data.success) {
      setEvents(data.data.events)
      setTotalEvents(data.data.pagination.total)
    }
  }

  useEffect(() => {
    fetchSessions()
    fetchEvents(1)
  }, [])

  const handlePasswordChange = async (data) => {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    })
    const result = await response.json()
    if (result.success) {
      toast.success('Password changed successfully')
    } else {
      throw new Error(result.error?.message || 'Failed to change password')
    }
  }

  const handleSessionTerminate = async (sessionId: string) => {
    const response = await fetch(`/api/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    })
    const result = await response.json()
    if (result.success) {
      toast.success('Session terminated')
    }
  }

  const handleSessionTerminateAll = async () => {
    const response = await fetch('/api/auth/sessions', {
      method: 'DELETE',
    })
    const result = await response.json()
    if (result.success) {
      toast.success(result.message)
    }
  }

  const handleExportLog = async () => {
    window.open('/api/auth/security-log/export', '_blank')
  }

  if (!session?.user?.id) {
    return <div>Please log in</div>
  }

  return (
    <SecuritySettings
      userId={session.user.id}
      sessions={sessions}
      currentSessionId={sessions.find(s => s.isCurrent)?.id || ''}
      securityEvents={events}
      totalEvents={totalEvents}
      currentPage={currentPage}
      pageSize={10}
      onPasswordChange={handlePasswordChange}
      onSessionTerminate={handleSessionTerminate}
      onSessionTerminateAll={handleSessionTerminateAll}
      onSessionsRefresh={fetchSessions}
      onPageChange={(page) => {
        setCurrentPage(page)
        fetchEvents(page)
      }}
      onExportLog={handleExportLog}
    />
  )
}
```
