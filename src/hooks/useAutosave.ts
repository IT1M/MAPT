import { useEffect, useRef, useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: SaveStatus;
  error: string | null;
  save: () => Promise<void>;
}

/**
 * Custom hook for auto-saving data with debounce
 * @param options - Configuration options
 * @returns Save status and manual save function
 */
export function useAutoSave<T>({
  data,
  onSave,
  delay = 500,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const debouncedData = useDebounce(data, delay);
  const isFirstRender = useRef(true);
  const previousDataRef = useRef<T>(data);

  const save = useCallback(async () => {
    if (!enabled) return;

    try {
      setStatus('saving');
      setError(null);
      await onSave(debouncedData);
      setStatus('saved');

      // Reset to idle after showing saved status
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save');
      console.error('Auto-save error:', err);
    }
  }, [debouncedData, onSave, enabled]);

  useEffect(() => {
    // Skip auto-save on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousDataRef.current = debouncedData;
      return;
    }

    // Skip if data hasn't changed
    if (
      JSON.stringify(previousDataRef.current) === JSON.stringify(debouncedData)
    ) {
      return;
    }

    // Skip if not enabled
    if (!enabled) {
      return;
    }

    previousDataRef.current = debouncedData;
    save();
  }, [debouncedData, enabled, save]);

  return {
    status,
    error,
    save,
  };
}
