'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/utils/toast';

export interface Notification {
  id: string;
  type: 'SYSTEM' | 'ACTIVITY' | 'APPROVAL' | 'ALERT' | 'MENTION';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  link?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  metadata?: any;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

const POLLING_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY = 'app-notifications-cache';

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationIdRef = useRef<string | null>(null);

  // Load cached notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const hydrated = parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
        setNotifications(hydrated);
      }
    } catch (error) {
      console.error('Failed to load notifications from cache:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (isHydrated && notifications.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      } catch (error) {
        console.error('Failed to cache notifications:', error);
      }
    }
  }, [notifications, isHydrated]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    try {
      const response = await fetch('/api/notifications?limit=50');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      const fetchedNotifications = data.notifications.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));

      setNotifications(fetchedNotifications);

      // Check for new critical notifications and show toast
      if (fetchedNotifications.length > 0 && lastNotificationIdRef.current) {
        const newNotifications = fetchedNotifications.filter(
          (n: Notification) =>
            n.id !== lastNotificationIdRef.current &&
            !n.read &&
            (n.priority === 'URGENT' || n.priority === 'HIGH')
        );

        newNotifications.forEach((n: Notification) => {
          if (n.priority === 'URGENT') {
            toast.error(n.title, n.message);
          } else if (n.priority === 'HIGH') {
            toast.warning(n.title, n.message);
          }
        });
      }

      if (fetchedNotifications.length > 0) {
        lastNotificationIdRef.current = fetchedNotifications[0].id;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [session, status]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    try {
      const response = await fetch('/api/notifications/unread-count');
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [session, status]);

  // Initial fetch and setup polling
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
      fetchUnreadCount();

      // Setup polling
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications();
        fetchUnreadCount();
      }, POLLING_INTERVAL);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [status, fetchNotifications, fetchUnreadCount]);

  // Add a new notification (for local/client-side notifications)
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast for critical notifications
      if (notification.priority === 'URGENT') {
        toast.error(notification.title, notification.message);
      } else if (notification.priority === 'HIGH') {
        toast.warning(notification.title, notification.message);
      }
    },
    []
  );

  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Don't call API for local notifications
    if (id.startsWith('local-')) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert optimistic update
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  }, [notifications, unreadCount]);

  // Remove a specific notification (local only)
  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => {
        const notification = notifications.find((n) => n.id === id);
        return notification && !notification.read
          ? Math.max(0, prev - 1)
          : prev;
      });
    },
    [notifications]
  );

  // Clear all notifications (local only)
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Refetch notifications
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    setIsLoading(false);
  }, [fetchNotifications, fetchUnreadCount]);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    refetch,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
}
