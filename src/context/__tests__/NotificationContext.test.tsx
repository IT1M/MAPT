/**
 * NotificationContext Tests
 * Tests for notification state management (add, read, remove operations)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { NotificationProvider, useNotifications } from '../NotificationContext'
import { ReactNode } from 'react'

describe('NotificationContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  )

  describe('Initial state', () => {
    it('should start with empty notifications', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      expect(result.current.notifications).toEqual([])
      expect(result.current.unreadCount).toBe(0)
    })

    it('should load notifications from localStorage', () => {
      const storedNotifications = [
        {
          id: 'notif-1',
          type: 'info' as const,
          title: 'Test Notification',
          message: 'Test message',
          timestamp: new Date().toISOString(),
          read: false,
        },
      ]
      localStorage.setItem('app-notifications', JSON.stringify(storedNotifications))

      const { result } = renderHook(() => useNotifications(), { wrapper })

      waitFor(() => {
        expect(result.current.notifications).toHaveLength(1)
        expect(result.current.notifications[0].title).toBe('Test Notification')
      })
    })
  })

  describe('addNotification', () => {
    it('should add a new notification', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'success',
          title: 'Success',
          message: 'Operation completed',
        })
      })

      waitFor(() => {
        expect(result.current.notifications).toHaveLength(1)
        expect(result.current.notifications[0].title).toBe('Success')
        expect(result.current.notifications[0].type).toBe('success')
        expect(result.current.notifications[0].read).toBe(false)
      })
    })

    it('should generate unique ID for notification', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'First',
          message: 'First message',
        })
        result.current.addNotification({
          type: 'info',
          title: 'Second',
          message: 'Second message',
        })
      })

      waitFor(() => {
        expect(result.current.notifications).toHaveLength(2)
        expect(result.current.notifications[0].id).not.toBe(result.current.notifications[1].id)
      })
    })

    it('should set timestamp automatically', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      const beforeTime = new Date()

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        })
      })

      const afterTime = new Date()

      waitFor(() => {
        const notification = result.current.notifications[0]
        const notifTime = new Date(notification.timestamp)
        expect(notifTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
        expect(notifTime.getTime()).toBeLessThanOrEqual(afterTime.getTime())
      })
    })

    it('should add notification with optional fields', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'warning',
          title: 'Warning',
          message: 'Warning message',
          actionUrl: '/action',
          actionLabel: 'View',
        })
      })

      waitFor(() => {
        const notification = result.current.notifications[0]
        expect(notification.actionUrl).toBe('/action')
        expect(notification.actionLabel).toBe('View')
      })
    })

    it('should add new notifications to the beginning', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'First',
          message: 'First message',
        })
        result.current.addNotification({
          type: 'info',
          title: 'Second',
          message: 'Second message',
        })
      })

      waitFor(() => {
        expect(result.current.notifications[0].title).toBe('Second')
        expect(result.current.notifications[1].title).toBe('First')
      })
    })

    it('should limit notifications to MAX_NOTIFICATIONS', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        // Add 51 notifications (MAX is 50)
        for (let i = 0; i < 51; i++) {
          result.current.addNotification({
            type: 'info',
            title: `Notification ${i}`,
            message: `Message ${i}`,
          })
        }
      })

      waitFor(() => {
        expect(result.current.notifications).toHaveLength(50)
        // Should keep the most recent 50
        expect(result.current.notifications[0].title).toBe('Notification 50')
      })
    })
  })

  describe('markAsRead', () => {
    it('should mark a notification as read', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        })
      })

      waitFor(() => {
        const notificationId = result.current.notifications[0].id

        act(() => {
          result.current.markAsRead(notificationId)
        })

        expect(result.current.notifications[0].read).toBe(true)
      })
    })

    it('should update unread count when marking as read', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test 1',
          message: 'Message 1',
        })
        result.current.addNotification({
          type: 'info',
          title: 'Test 2',
          message: 'Message 2',
        })
      })

      waitFor(() => {
        expect(result.current.unreadCount).toBe(2)

        const notificationId = result.current.notifications[0].id

        act(() => {
          result.current.markAsRead(notificationId)
        })

        expect(result.current.unreadCount).toBe(1)
      })
    })

    it('should not affect other notifications', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test 1',
          message: 'Message 1',
        })
        result.current.addNotification({
          type: 'info',
          title: 'Test 2',
          message: 'Message 2',
        })
      })

      waitFor(() => {
        const firstId = result.current.notifications[0].id

        act(() => {
          result.current.markAsRead(firstId)
        })

        expect(result.current.notifications[0].read).toBe(true)
        expect(result.current.notifications[1].read).toBe(false)
      })
    })

    it('should handle marking non-existent notification', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        })
      })

      waitFor(() => {
        act(() => {
          result.current.markAsRead('non-existent-id')
        })

        // Should not throw error
        expect(result.current.notifications).toHaveLength(1)
      })
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test 1',
          message: 'Message 1',
        })
        result.current.addNotification({
          type: 'info',
          title: 'Test 2',
          message: 'Message 2',
        })
        result.current.addNotification({
          type: 'info',
          title: 'Test 3',
          message: 'Message 3',
        })
      })

      waitFor(() => {
        expect(result.current.unreadCount).toBe(3)

        act(() => {
          result.current.markAllAsRead()
        })

        expect(result.current.unreadCount).toBe(0)
        result.current.notifications.forEach(notif => {
          expect(notif.read).toBe(true)
        })
      })
    })

    it('should work with empty notifications', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.markAllAsRead()
      })

      expect(result.current.notifications).toEqual([])
      expect(result.current.unreadCount).toBe(0)
    })
  })

  describe('removeNotification', () => {
    it('should remove a specific notification', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test 1',
          message: 'Message 1',
        })
        result.current.addNotification({
          type: 'info',
          title: 'Test 2',
          message: 'Message 2',
        })
      })

      waitFor(() => {
        const firstId = result.current.notifications[0].id

        act(() => {
          result.current.removeNotification(firstId)
        })

        expect(result.current.notifications).toHaveLength(1)
        expect(result.current.notifications[0].title).toBe('Test 1')
      })
    })

    it('should update unread count when removing unread notification', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Message',
        })
      })

      waitFor(() => {
        expect(result.current.unreadCount).toBe(1)

        const notificationId = result.current.notifications[0].id

        act(() => {
          result.current.removeNotification(notificationId)
        })

        expect(result.current.unreadCount).toBe(0)
      })
    })

    it('should handle removing non-existent notification', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Message',
        })
      })

      waitFor(() => {
        act(() => {
          result.current.removeNotification('non-existent-id')
        })

        expect(result.current.notifications).toHaveLength(1)
      })
    })
  })

  describe('clearAll', () => {
    it('should remove all notifications', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test 1',
          message: 'Message 1',
        })
        result.current.addNotification({
          type: 'info',
          title: 'Test 2',
          message: 'Message 2',
        })
      })

      waitFor(() => {
        expect(result.current.notifications).toHaveLength(2)

        act(() => {
          result.current.clearAll()
        })

        expect(result.current.notifications).toEqual([])
        expect(result.current.unreadCount).toBe(0)
      })
    })

    it('should work with empty notifications', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.clearAll()
      })

      expect(result.current.notifications).toEqual([])
    })
  })

  describe('unreadCount', () => {
    it('should calculate unread count correctly', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test 1',
          message: 'Message 1',
        })
        result.current.addNotification({
          type: 'info',
          title: 'Test 2',
          message: 'Message 2',
        })
        result.current.addNotification({
          type: 'info',
          title: 'Test 3',
          message: 'Message 3',
        })
      })

      waitFor(() => {
        expect(result.current.unreadCount).toBe(3)

        const firstId = result.current.notifications[0].id

        act(() => {
          result.current.markAsRead(firstId)
        })

        expect(result.current.unreadCount).toBe(2)
      })
    })

    it('should be 0 when all notifications are read', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Message',
        })
      })

      waitFor(() => {
        act(() => {
          result.current.markAllAsRead()
        })

        expect(result.current.unreadCount).toBe(0)
      })
    })
  })

  describe('localStorage persistence', () => {
    it('should save notifications to localStorage', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        })
      })

      waitFor(() => {
        const stored = localStorage.getItem('app-notifications')
        expect(stored).toBeTruthy()
        
        const parsed = JSON.parse(stored!)
        expect(parsed).toHaveLength(1)
        expect(parsed[0].title).toBe('Test')
      })
    })

    it('should update localStorage when notifications change', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Message',
        })
      })

      waitFor(() => {
        const notificationId = result.current.notifications[0].id

        act(() => {
          result.current.markAsRead(notificationId)
        })

        const stored = localStorage.getItem('app-notifications')
        const parsed = JSON.parse(stored!)
        expect(parsed[0].read).toBe(true)
      })
    })

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage full')
      })

      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Message',
        })
      })

      // Should not throw error
      waitFor(() => {
        expect(result.current.notifications).toHaveLength(1)
      })

      // Restore original
      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('Error handling', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useNotifications())
      }).toThrow('useNotifications must be used within a NotificationProvider')
    })
  })

  describe('Notification types', () => {
    it('should support info type', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Info',
          message: 'Info message',
        })
      })

      waitFor(() => {
        expect(result.current.notifications[0].type).toBe('info')
      })
    })

    it('should support success type', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'success',
          title: 'Success',
          message: 'Success message',
        })
      })

      waitFor(() => {
        expect(result.current.notifications[0].type).toBe('success')
      })
    })

    it('should support warning type', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'warning',
          title: 'Warning',
          message: 'Warning message',
        })
      })

      waitFor(() => {
        expect(result.current.notifications[0].type).toBe('warning')
      })
    })

    it('should support error type', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper })

      act(() => {
        result.current.addNotification({
          type: 'error',
          title: 'Error',
          message: 'Error message',
        })
      })

      waitFor(() => {
        expect(result.current.notifications[0].type).toBe('error')
      })
    })
  })
})
