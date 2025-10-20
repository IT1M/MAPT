/**
 * Offline Queue System
 * Manages actions performed while offline and syncs them when connection is restored
 */

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data: any;
  timestamp: Date;
  synced: boolean;
  error?: string;
  retries: number;
}

export interface SyncResult {
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

const QUEUE_KEY = 'offline-queue';
const MAX_RETRIES = 3;

class OfflineQueueManager {
  private queue: OfflineAction[] = [];
  private isSyncing = false;
  private listeners: Array<(queue: OfflineAction[]) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueue();
      this.setupOnlineListener();
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored).map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }));
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  }

  /**
   * Setup listener for online/offline events
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('[OfflineQueue] Connection restored, syncing queue...');
      this.sync();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineQueue] Connection lost');
    });

    // Listen for service worker sync messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_OFFLINE_QUEUE') {
          this.sync();
        }
      });
    }
  }

  /**
   * Add action to queue
   */
  add(
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retries'>
  ): string {
    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateId(),
      timestamp: new Date(),
      synced: false,
      retries: 0,
    };

    this.queue.push(offlineAction);
    this.saveQueue();

    console.log('[OfflineQueue] Action added:', offlineAction);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.sync();
    }

    return offlineAction.id;
  }

  /**
   * Get all pending actions
   */
  getPending(): OfflineAction[] {
    return this.queue.filter((action) => !action.synced);
  }

  /**
   * Get all actions
   */
  getAll(): OfflineAction[] {
    return [...this.queue];
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return this.getPending().length;
  }

  /**
   * Clear synced actions
   */
  clearSynced(): void {
    this.queue = this.queue.filter((action) => !action.synced);
    this.saveQueue();
  }

  /**
   * Clear all actions
   */
  clearAll(): void {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Sync all pending actions
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[OfflineQueue] Sync already in progress');
      return { successful: 0, failed: 0, errors: [] };
    }

    if (!navigator.onLine) {
      console.log('[OfflineQueue] Cannot sync while offline');
      return { successful: 0, failed: 0, errors: [] };
    }

    this.isSyncing = true;
    const pending = this.getPending();
    const result: SyncResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    console.log(`[OfflineQueue] Syncing ${pending.length} actions...`);

    for (const action of pending) {
      try {
        await this.syncAction(action);
        action.synced = true;
        result.successful++;
        console.log('[OfflineQueue] Action synced:', action.id);
      } catch (error) {
        action.retries++;
        action.error = error instanceof Error ? error.message : 'Unknown error';
        result.failed++;
        result.errors.push({
          id: action.id,
          error: action.error,
        });

        console.error(
          '[OfflineQueue] Failed to sync action:',
          action.id,
          error
        );

        // Remove action if max retries reached
        if (action.retries >= MAX_RETRIES) {
          console.error(
            '[OfflineQueue] Max retries reached, removing action:',
            action.id
          );
          this.queue = this.queue.filter((a) => a.id !== action.id);
        }
      }
    }

    this.saveQueue();
    this.isSyncing = false;

    console.log('[OfflineQueue] Sync complete:', result);

    return result;
  }

  /**
   * Sync a single action
   */
  private async syncAction(action: OfflineAction): Promise<void> {
    const response = await fetch(action.endpoint, {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: action.data ? JSON.stringify(action.data) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return response.json();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: OfflineAction[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.queue));
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueueManager();

/**
 * Helper function to queue an API call
 */
export function queueApiCall(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  data?: any
): string {
  const entity = endpoint.split('/')[2] || 'unknown'; // Extract entity from /api/entity/...

  return offlineQueue.add({
    type:
      method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update',
    entity,
    endpoint,
    method,
    data,
  });
}

/**
 * Helper function to check if offline
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Helper function to wait for online
 */
export function waitForOnline(): Promise<void> {
  if (navigator.onLine) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const handler = () => {
      window.removeEventListener('online', handler);
      resolve();
    };
    window.addEventListener('online', handler);
  });
}
