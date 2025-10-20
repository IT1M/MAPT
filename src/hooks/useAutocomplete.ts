import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAutocompleteOptions {
  searchTerm: string;
  type: 'itemName' | 'category';
  debounceMs?: number;
  minChars?: number;
}

export function useAutocomplete({
  searchTerm,
  type,
  debounceMs = 300,
  minChars = 2,
}: UseAutocompleteOptions) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch suggestions with debouncing
  useEffect(() => {
    // Reset suggestions if search term is too short
    if (searchTerm.length < minChars) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      abortControllerRef.current = new AbortController();

      try {
        const params = new URLSearchParams({
          q: searchTerm,
          type,
        });

        const response = await fetch(`/api/inventory/suggestions?${params}`, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const result = await response.json();

        if (result.success && result.data?.suggestions) {
          setSuggestions(result.data.suggestions);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch suggestions:', error);
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchTerm, type, debounceMs, minChars]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;

        case 'Escape':
          e.preventDefault();
          setSuggestions([]);
          setSelectedIndex(-1);
          break;

        default:
          break;
      }
    },
    [suggestions.length]
  );

  const selectSuggestion = useCallback(
    (index: number): string | null => {
      if (index >= 0 && index < suggestions.length) {
        const selected = suggestions[index];
        setSuggestions([]);
        setSelectedIndex(-1);
        return selected;
      }
      return null;
    },
    [suggestions]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSelectedIndex(-1);
  }, []);

  return {
    suggestions,
    isLoading,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    selectSuggestion,
    clearSuggestions,
  };
}
