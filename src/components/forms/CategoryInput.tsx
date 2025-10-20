'use client';

import React, { useRef, useEffect } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { useAutocomplete } from '@/hooks/useAutocomplete';

interface CategoryInputProps extends Omit<InputProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
}

export function CategoryInput({
  value,
  onChange,
  onSelect,
  error,
  helperText = 'e.g., Surgical Supplies, Pharmaceuticals, Equipment',
  ...props
}: CategoryInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    suggestions,
    isLoading,
    selectedIndex,
    handleKeyDown,
    selectSuggestion,
    clearSuggestions,
    setSelectedIndex,
  } = useAutocomplete({
    searchTerm: value,
    type: 'category',
    debounceMs: 300,
    minChars: 2,
  });

  // Handle suggestion selection
  const handleSelectSuggestion = (index: number) => {
    const selected = selectSuggestion(index);
    if (selected) {
      onChange(selected);
      onSelect?.(selected);
      inputRef.current?.focus();
    }
  };

  // Handle keyboard events
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && selectedIndex >= 0 && suggestions.length > 0) {
      e.preventDefault();
      handleSelectSuggestion(selectedIndex);
    } else {
      handleKeyDown(e);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        clearSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearSuggestions]);

  const showDropdown = suggestions.length > 0 || isLoading;

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleInputKeyDown}
        error={error}
        helperText={helperText}
        aria-autocomplete="list"
        aria-controls={showDropdown ? 'category-suggestions' : undefined}
        aria-expanded={showDropdown}
        aria-activedescendant={
          selectedIndex >= 0
            ? `category-suggestion-${selectedIndex}`
            : undefined
        }
        {...props}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute right-3 top-9 text-gray-500 dark:text-gray-400">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="category-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                id={`category-suggestion-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleSelectSuggestion(index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="text-sm">{suggestion}</span>
              </div>
            ))
          ) : null}
        </div>
      )}
    </div>
  );
}
