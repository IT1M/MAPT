/**
 * Theme Customization Tests
 * Tests for theme system functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThemeCustomization } from '@/hooks/useThemeCustomization'
import { PRESET_THEMES } from '@/config/themes'

describe('Theme Customization', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    
    // Mock BroadcastChannel
    global.BroadcastChannel = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      close: vi.fn(),
      onmessage: null,
    })) as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('useThemeCustomization Hook', () => {
    it('should initialize with default theme', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      expect(result.current.currentTheme).toEqual(PRESET_THEMES[0])
      expect(result.current.isLoading).toBe(false)
    })

    it('should load saved theme from localStorage', () => {
      const savedTheme = PRESET_THEMES[1]
      localStorage.setItem('custom-theme', JSON.stringify(savedTheme))
      
      const { result } = renderHook(() => useThemeCustomization())
      
      expect(result.current.currentTheme).toEqual(savedTheme)
    })

    it('should select preset theme', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.selectPreset('ocean')
      })
      
      expect(result.current.currentTheme.id).toBe('ocean')
      expect(result.current.currentTheme.name).toBe('Ocean')
    })

    it('should update colors', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.updateColors({ primary: '#ff0000' })
      })
      
      expect(result.current.currentTheme.colors.primary).toBe('#ff0000')
    })

    it('should update fonts', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.updateFonts({ family: 'Arial, sans-serif' })
      })
      
      expect(result.current.currentTheme.fonts.family).toBe('Arial, sans-serif')
    })

    it('should update font sizes', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.updateFonts({
          size: { ...result.current.currentTheme.fonts.size, base: '18px' }
        })
      })
      
      expect(result.current.currentTheme.fonts.size.base).toBe('18px')
    })

    it('should update density', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.updateDensity('compact')
      })
      
      expect(result.current.currentTheme.spacing.density).toBe('compact')
    })

    it('should update animations', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.updateAnimations({ enabled: false })
      })
      
      expect(result.current.currentTheme.animations.enabled).toBe(false)
    })

    it('should update animation speed', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.updateAnimations({ speed: 'fast' })
      })
      
      expect(result.current.currentTheme.animations.speed).toBe('fast')
    })

    it('should persist theme to localStorage', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.selectPreset('forest')
      })
      
      const saved = localStorage.getItem('custom-theme')
      expect(saved).toBeTruthy()
      
      const parsed = JSON.parse(saved!)
      expect(parsed.id).toBe('forest')
    })

    it('should generate share code', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      let shareCode: string = ''
      act(() => {
        shareCode = result.current.generateShareCode()
      })
      
      expect(shareCode).toBeTruthy()
      expect(typeof shareCode).toBe('string')
    })

    it('should import theme from share code', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      let shareCode: string = ''
      act(() => {
        result.current.selectPreset('sunset')
        shareCode = result.current.generateShareCode()
      })
      
      act(() => {
        result.current.selectPreset('default')
      })
      
      expect(result.current.currentTheme.id).toBe('default')
      
      act(() => {
        const importResult = result.current.importFromShareCode(shareCode)
        expect(importResult.success).toBe(true)
      })
      
      expect(result.current.currentTheme.id).toBe('sunset')
    })

    it('should handle invalid share code', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      let importResult: { success: boolean; error?: string } = { success: false }
      act(() => {
        importResult = result.current.importFromShareCode('invalid-code')
      })
      
      expect(importResult.success).toBe(false)
      expect(importResult.error).toBeTruthy()
    })

    it('should import theme from JSON', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      const themeJson = JSON.stringify(PRESET_THEMES[2])
      
      act(() => {
        const importResult = result.current.importTheme(themeJson)
        expect(importResult.success).toBe(true)
      })
      
      expect(result.current.currentTheme.id).toBe(PRESET_THEMES[2].id)
    })

    it('should handle invalid JSON import', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      let importResult: { success: boolean; error?: string } = { success: false }
      act(() => {
        importResult = result.current.importTheme('invalid json')
      })
      
      expect(importResult.success).toBe(false)
      expect(importResult.error).toBeTruthy()
    })

    it('should reset to default theme', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.selectPreset('royal')
      })
      
      expect(result.current.currentTheme.id).toBe('royal')
      
      act(() => {
        result.current.resetToDefault()
      })
      
      expect(result.current.currentTheme.id).toBe('default')
    })

    it('should apply CSS variables when theme changes', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.updateColors({ primary: '#123456' })
      })
      
      const root = document.documentElement
      expect(root.style.getPropertyValue('--theme-primary')).toBe('#123456')
    })

    it('should apply density classes', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.updateDensity('spacious')
      })
      
      const root = document.documentElement
      expect(root.classList.contains('density-spacious')).toBe(true)
      expect(root.classList.contains('density-compact')).toBe(false)
      expect(root.classList.contains('density-comfortable')).toBe(false)
    })

    it('should apply animation classes', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      act(() => {
        result.current.updateAnimations({ enabled: false })
      })
      
      const root = document.documentElement
      expect(root.classList.contains('animations-disabled')).toBe(true)
    })
  })

  describe('Theme Presets', () => {
    it('should have 6 preset themes', () => {
      expect(PRESET_THEMES).toHaveLength(6)
    })

    it('should have unique IDs', () => {
      const ids = PRESET_THEMES.map(t => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(PRESET_THEMES.length)
    })

    it('should have all required properties', () => {
      PRESET_THEMES.forEach(theme => {
        expect(theme).toHaveProperty('id')
        expect(theme).toHaveProperty('name')
        expect(theme).toHaveProperty('description')
        expect(theme).toHaveProperty('colors')
        expect(theme).toHaveProperty('fonts')
        expect(theme).toHaveProperty('spacing')
        expect(theme).toHaveProperty('animations')
      })
    })

    it('should have all required color properties', () => {
      const requiredColors = [
        'primary', 'secondary', 'accent', 'background', 'foreground',
        'muted', 'mutedForeground', 'border', 'card', 'cardForeground',
        'success', 'warning', 'error', 'info'
      ]
      
      PRESET_THEMES.forEach(theme => {
        requiredColors.forEach(color => {
          expect(theme.colors).toHaveProperty(color)
          expect(typeof theme.colors[color as keyof typeof theme.colors]).toBe('string')
        })
      })
    })
  })

  describe('Theme Export/Import', () => {
    it('should export theme as downloadable file', () => {
      const { result } = renderHook(() => useThemeCustomization())
      
      // Mock createElement and appendChild
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)
      
      act(() => {
        result.current.exportTheme()
      })
      
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(mockLink.click).toHaveBeenCalled()
      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
      
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })
})
