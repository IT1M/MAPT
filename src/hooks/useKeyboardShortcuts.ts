import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  callback: (event: KeyboardEvent) => void
  description: string
  preventDefault?: boolean
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

/**
 * Hook for managing keyboard shortcuts with accessibility support
 * Supports common shortcuts like Ctrl+S, Ctrl+K, Esc
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Find matching shortcut
      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey
        const metaMatches = shortcut.metaKey ? event.metaKey : !event.metaKey
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey

        // On Mac, Cmd key is metaKey, on Windows/Linux it's ctrlKey
        const modifierMatches =
          (shortcut.ctrlKey || shortcut.metaKey) &&
          (event.ctrlKey || event.metaKey)

        if (shortcut.ctrlKey || shortcut.metaKey) {
          return keyMatches && modifierMatches && shiftMatches && altMatches
        }

        return keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches
      })

      if (matchingShortcut) {
        if (matchingShortcut.preventDefault !== false) {
          event.preventDefault()
        }
        matchingShortcut.callback(event)
      }
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])

  return {
    shortcuts,
  }
}

/**
 * Hook for settings-specific keyboard shortcuts
 */
export function useSettingsKeyboardShortcuts({
  onSave,
  onSearch,
  onEscape,
  enabled = true,
}: {
  onSave?: () => void
  onSearch?: () => void
  onEscape?: () => void
  enabled?: boolean
}) {
  const shortcuts: KeyboardShortcut[] = []

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      metaKey: true,
      callback: () => onSave(),
      description: 'Save current settings',
      preventDefault: true,
    })
  }

  if (onSearch) {
    shortcuts.push({
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      callback: () => onSearch(),
      description: 'Focus search',
      preventDefault: true,
    })
  }

  if (onEscape) {
    shortcuts.push({
      key: 'Escape',
      callback: () => onEscape(),
      description: 'Close modal or cancel',
      preventDefault: false,
    })
  }

  useKeyboardShortcuts({ shortcuts, enabled })

  return { shortcuts }
}
