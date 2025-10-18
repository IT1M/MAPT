import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  trapFocus,
  restoreFocus,
  getFocusableElements,
  announceToScreenReader,
  isElementFocusable,
  getNextFocusableElement,
  prefersReducedMotion,
  getAnimationDuration,
} from '../accessibility'

describe('Accessibility Utilities', () => {
  describe('getFocusableElements', () => {
    it('should find all focusable elements in a container', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <button>Button 1</button>
        <a href="#">Link</a>
        <input type="text" />
        <button disabled>Disabled Button</button>
        <div tabindex="0">Focusable Div</div>
        <div tabindex="-1">Non-focusable Div</div>
      `

      const focusable = getFocusableElements(container)
      expect(focusable.length).toBe(4) // button, link, input, focusable div
    })
  })

  describe('isElementFocusable', () => {
    it('should return true for focusable elements', () => {
      const button = document.createElement('button')
      expect(isElementFocusable(button)).toBe(true)
    })

    it('should return false for disabled elements', () => {
      const button = document.createElement('button')
      button.disabled = true
      expect(isElementFocusable(button)).toBe(false)
    })

    it('should return false for elements with tabindex="-1"', () => {
      const div = document.createElement('div')
      div.setAttribute('tabindex', '-1')
      expect(isElementFocusable(div)).toBe(false)
    })
  })

  describe('getNextFocusableElement', () => {
    it('should get next focusable element', () => {
      const elements = [
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('button'),
      ]

      const next = getNextFocusableElement(elements, elements[0], 'next')
      expect(next).toBe(elements[1])
    })

    it('should wrap around to first element', () => {
      const elements = [
        document.createElement('button'),
        document.createElement('button'),
      ]

      const next = getNextFocusableElement(elements, elements[1], 'next')
      expect(next).toBe(elements[0])
    })

    it('should get previous focusable element', () => {
      const elements = [
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('button'),
      ]

      const prev = getNextFocusableElement(elements, elements[1], 'previous')
      expect(prev).toBe(elements[0])
    })
  })

  describe('announceToScreenReader', () => {
    it('should create and remove announcement element', () => {
      vi.useFakeTimers()

      announceToScreenReader('Test message', 'polite')

      const announcements = document.querySelectorAll('[role="status"]')
      expect(announcements.length).toBeGreaterThan(0)

      vi.advanceTimersByTime(1000)

      const announcementsAfter = document.querySelectorAll('[role="status"]')
      expect(announcementsAfter.length).toBe(0)

      vi.useRealTimers()
    })
  })

  describe('getAnimationDuration', () => {
    it('should return 0 if user prefers reduced motion', () => {
      // Mock matchMedia to return true for reduced motion
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      expect(getAnimationDuration(300)).toBe(0)
    })

    it('should return default duration if user does not prefer reduced motion', () => {
      // Mock matchMedia to return false for reduced motion
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      expect(getAnimationDuration(300)).toBe(300)
    })
  })

  describe('restoreFocus', () => {
    it('should focus the element', () => {
      vi.useFakeTimers()

      const button = document.createElement('button')
      document.body.appendChild(button)

      const focusSpy = vi.spyOn(button, 'focus')

      restoreFocus(button)

      vi.advanceTimersByTime(0)

      expect(focusSpy).toHaveBeenCalled()

      document.body.removeChild(button)
      vi.useRealTimers()
    })

    it('should handle null element gracefully', () => {
      expect(() => restoreFocus(null)).not.toThrow()
    })
  })
})
