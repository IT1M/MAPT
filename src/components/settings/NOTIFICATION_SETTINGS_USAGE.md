# Notification Settings - Usage Guide

## Overview

The Notification Settings component allows users to configure their email and in-app notification preferences, with role-based access control and test functionality.

## Quick Start

### 1. Import the Component

```tsx
import { NotificationSettings } from '@/components/settings'
```

### 2. Use in Your Settings Page

```tsx
'use client'

import { useState } from 'react'
import { NotificationSettings } from '@/components/settings'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('notifications')

  return (
    <div className="container mx-auto p-6">
      {activeSection === 'notifications' && <NotificationSettings />}
    </div>
  )
}
```

## Features

### Email Notifications

Users can toggle the following email notification types:

- **Daily Inventory Summary**: Daily summary of inventory activities
- **Weekly Analytics Report**: Weekly insights and analytics
- **New User Registration**: Notifications when new users register (Admin only)
- **High Reject Rate Alert**: Alerts when reject rates exceed thresholds
- **System Updates**: Information about system updates and maintenance
- **Backup Completion**: Notifications when system backups complete

### In-App Notifications

Users can configure:

- **Browser Notifications**: Enable/disable browser notifications
- **Sound**: Play sound when notifications arrive (requires browser notifications)
- **Desktop Notifications**: Show desktop notifications when browser is minimized (requires browser notifications)

### Notification Frequency

Users can choose how often they receive notifications:

- **Real-time**: Immediate notifications as events occur
- **Batched (Hourly)**: Notifications grouped and sent every hour
- **Daily Digest**: Single daily summary of all notifications
- **Custom Schedule**: Set a custom notification schedule

### Test Notifications

Users can send a test notification to verify their settings:

- Sends a test email to the user's email address
- Shows a toast notification in the browser
- Confirms that notification settings are working correctly

## API Endpoints

### GET /api/users/notifications

Fetch the current user's notification preferences.

**Response**:
```json
{
  "success": true,
  "data": {
    "email": {
      "dailyInventorySummary": true,
      "weeklyAnalyticsReport": true,
      "newUserRegistration": false,
      "highRejectRateAlert": true,
      "systemUpdates": true,
      "backupStatus": false
    },
    "inApp": {
      "enabled": true,
      "sound": true,
      "desktop": false
    },
    "frequency": "realtime"
  }
}
```

### PATCH /api/users/notifications

Update notification preferences.

**Request Body**:
```json
{
  "email": {
    "dailyInventorySummary": false
  },
  "frequency": "daily"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "email": { ... },
    "inApp": { ... },
    "frequency": "daily"
  },
  "message": "Notification preferences updated successfully"
}
```

### POST /api/users/notifications/test

Send a test notification.

**Response**:
```json
{
  "success": true,
  "message": "Test notification sent successfully",
  "data": {
    "emailSent": true,
    "inAppEnabled": true
  }
}
```

## Role-Based Access Control

### Admin-Only Features

The following notification option is only visible to users with the ADMIN role:

- **New User Registration**: Notifications when new users are registered

Non-admin users will not see this option in the UI, and the server will prevent them from enabling it even if they try to bypass the client-side check.

### Implementation

```tsx
const { data: session } = useSession()
const isAdmin = session?.user?.role === 'ADMIN'

// In the component
{isAdmin && (
  <NotificationToggle
    label="New User Registration"
    description="Get notified when new users are registered (Admin only)"
    checked={preferences.email.newUserRegistration}
    onChange={() => handleEmailToggle('newUserRegistration')}
  />
)}
```

## Customization

### Styling

The component uses Tailwind CSS classes and supports dark mode:

```tsx
// Light mode
className="bg-white text-gray-900"

// Dark mode
className="dark:bg-gray-800 dark:text-white"
```

### Adding New Notification Types

1. Update the type definition in `src/types/settings.ts`:

```typescript
export interface EmailNotifications {
  dailyInventorySummary: boolean
  weeklyAnalyticsReport: boolean
  newUserRegistration: boolean
  highRejectRateAlert: boolean
  systemUpdates: boolean
  backupStatus: boolean
  // Add new type here
  newNotificationType: boolean
}
```

2. Update the default preferences in the component:

```typescript
const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: {
    // ... existing types
    newNotificationType: false,
  },
  // ...
}
```

3. Add the toggle in the component:

```tsx
<NotificationToggle
  label="New Notification Type"
  description="Description of the new notification"
  checked={preferences.email.newNotificationType}
  onChange={() => handleEmailToggle('newNotificationType')}
/>
```

4. Update the API validation schema in `src/app/api/users/notifications/route.ts`:

```typescript
const notificationPreferencesSchema = z.object({
  email: z.object({
    // ... existing types
    newNotificationType: z.boolean().optional(),
  }).optional(),
  // ...
})
```

## Integration with Email Service

The test notification endpoint uses the email utility from `src/utils/email.ts`. To integrate with a real email service:

1. Update `src/utils/email.ts` to use your email service (SendGrid, AWS SES, etc.)
2. Configure environment variables for your email service
3. The notification settings will automatically use the updated email service

Example with SendGrid:

```typescript
// src/utils/email.ts
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  await sgMail.send({
    to: options.to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: options.subject,
    text: options.text,
    html: options.html,
  })
}
```

## Accessibility

The component includes accessibility features:

- **ARIA Labels**: All interactive elements have proper ARIA labels
- **Keyboard Navigation**: Full keyboard support for all controls
- **Screen Reader Support**: Descriptive labels and state announcements
- **Focus Management**: Proper focus indicators and tab order
- **Color Contrast**: WCAG AA compliant color contrast ratios

## Best Practices

1. **Auto-save**: Preferences are automatically saved when changed
2. **Loading States**: Show loading indicators during save operations
3. **Error Handling**: Display clear error messages if save fails
4. **Optimistic Updates**: Update UI immediately for better UX
5. **Toast Notifications**: Provide feedback for all actions
6. **Role Validation**: Always validate roles on the server-side

## Troubleshooting

### Preferences Not Saving

- Check browser console for errors
- Verify authentication token is valid
- Check network tab for API response
- Ensure user has proper permissions

### Test Email Not Received

- Check spam folder
- Verify email service is configured
- Check server logs for email sending errors
- In development, check console logs (emails are logged, not sent)

### Admin Options Not Visible

- Verify user has ADMIN role
- Check session data in browser DevTools
- Refresh the page to reload session

## Example: Complete Settings Page

```tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  SettingsLayout,
  ProfileSettings,
  SecuritySettings,
  NotificationSettings,
  AppearanceSettings,
} from '@/components/settings'
import type { SettingsSection } from '@/types/settings'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')

  if (!session?.user) {
    return <div>Please log in</div>
  }

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      userRole={session.user.role}
    >
      {activeSection === 'profile' && <ProfileSettings />}
      {activeSection === 'security' && <SecuritySettings />}
      {activeSection === 'notifications' && <NotificationSettings />}
      {activeSection === 'appearance' && <AppearanceSettings />}
    </SettingsLayout>
  )
}
```

## Support

For issues or questions:
1. Check the verification document: `NOTIFICATION_SETTINGS_VERIFICATION.md`
2. Review the design document: `.kiro/specs/settings-interface/design.md`
3. Check the requirements: `.kiro/specs/settings-interface/requirements.md`
