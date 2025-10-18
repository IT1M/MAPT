# Notification System

A comprehensive notification system for the application with support for multiple notification types, persistent storage, and RTL layouts.

## Features

- ✅ Multiple notification types (info, success, warning, error)
- ✅ Persistent storage in localStorage
- ✅ Unread count badge
- ✅ Mark as read functionality
- ✅ Action buttons with navigation
- ✅ Auto-dismiss option
- ✅ RTL support
- ✅ Responsive design
- ✅ Accessibility compliant
- ✅ Dark mode support

## Components

### NotificationContext

The main context provider that manages notification state.

```tsx
import { NotificationProvider } from '@/context/NotificationContext'

// Wrap your app with the provider
<NotificationProvider>
  {children}
</NotificationProvider>
```

### useNotifications Hook

Access notification functionality from any component:

```tsx
import { useNotifications } from '@/context/NotificationContext'

function MyComponent() {
  const { 
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll 
  } = useNotifications()

  // Add a notification
  const handleSuccess = () => {
    addNotification({
      type: 'success',
      title: 'Success!',
      message: 'Item saved successfully',
      actionUrl: '/data-log',
      actionLabel: 'View Item'
    })
  }

  return <button onClick={handleSuccess}>Save</button>
}
```

### NotificationBell

The bell icon component that displays in the header:

```tsx
import { NotificationBell } from '@/components/notifications'

<NotificationBell />
```

## Notification Types

### Info
```tsx
addNotification({
  type: 'info',
  title: 'Information',
  message: 'This is an informational message'
})
```

### Success
```tsx
addNotification({
  type: 'success',
  title: 'Success!',
  message: 'Operation completed successfully',
  actionUrl: '/dashboard',
  actionLabel: 'View Dashboard'
})
```

### Warning
```tsx
addNotification({
  type: 'warning',
  title: 'Warning',
  message: 'High reject rate detected'
})
```

### Error
```tsx
addNotification({
  type: 'error',
  title: 'Error',
  message: 'Failed to save item'
})
```

## Usage Examples

### After Form Submission
```tsx
const handleSubmit = async (data) => {
  try {
    await saveItem(data)
    addNotification({
      type: 'success',
      title: t('success.saved'),
      message: t('dataEntry.itemSaved'),
      actionUrl: `/${locale}/data-log`,
      actionLabel: t('dataEntry.viewInLog')
    })
  } catch (error) {
    addNotification({
      type: 'error',
      title: t('errors.saveFailed'),
      message: error.message
    })
  }
}
```

### System Alerts
```tsx
// High reject rate alert
if (rejectRate > 10) {
  addNotification({
    type: 'warning',
    title: t('alerts.highRejectRate'),
    message: t('alerts.rejectRateMessage', { rate: rejectRate }),
    actionUrl: `/${locale}/analytics`,
    actionLabel: t('alerts.viewAnalytics')
  })
}
```

### Background Tasks
```tsx
// Report generation complete
addNotification({
  type: 'success',
  title: t('reports.ready'),
  message: t('reports.generationComplete'),
  actionUrl: `/${locale}/reports`,
  actionLabel: t('reports.download')
})
```

## API Reference

### NotificationContextValue

```typescript
interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}
```

### Notification Interface

```typescript
interface Notification {
  id: string                    // Auto-generated
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date               // Auto-generated
  read: boolean                 // Auto-set to false
  actionUrl?: string           // Optional navigation URL
  actionLabel?: string         // Optional action button label
}
```

## Storage

Notifications are automatically persisted to localStorage under the key `app-notifications`. The system keeps the most recent 50 notifications.

## Accessibility

- Keyboard navigation support (Escape to close)
- ARIA labels and roles
- Focus management
- Screen reader announcements
- High contrast mode support

## RTL Support

The notification system fully supports RTL layouts:
- Dropdown positioning adjusts automatically
- Icons and badges flip for RTL
- Text alignment follows locale direction

## Testing

Use the `NotificationDemo` component to test the notification system:

```tsx
import { NotificationDemo } from '@/components/notifications/NotificationDemo'

// Add to any page temporarily
<NotificationDemo />
```

## Future Enhancements

- [ ] Desktop notifications (browser API)
- [ ] Sound notifications
- [ ] Auto-dismiss with timeout
- [ ] Notification categories/filters
- [ ] Server-sent notifications
- [ ] Push notifications
- [ ] Notification preferences per user
