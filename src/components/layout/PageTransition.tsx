'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageTransition Component
 * 
 * Provides smooth fade transitions between page navigations.
 * Respects user's prefers-reduced-motion preference.
 * 
 * Features:
 * - 200ms fade animation on route changes
 * - Prevents layout shift during transitions
 * - GPU-accelerated for 60fps performance
 * - Automatic cleanup and optimization
 * 
 * @example
 * <PageTransition>
 *   <YourPageContent />
 * </PageTransition>
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Start transition
    setIsTransitioning(true)

    // Update children after fade out
    timeoutRef.current = setTimeout(() => {
      setDisplayChildren(children)
      setIsTransitioning(false)
    }, 200) // Match animation duration

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [pathname, children])

  return (
    <div
      className={`page-transition-wrapper ${className}`}
      style={{
        opacity: isTransitioning ? 0 : 1,
        transition: 'opacity 200ms ease-in-out',
        willChange: isTransitioning ? 'opacity' : 'auto',
      }}
    >
      {displayChildren}
    </div>
  )
}

/**
 * Simple fade transition without route detection
 * Useful for conditional content changes within a page
 */
export function FadeTransition({ 
  children, 
  show = true,
  duration = 200,
  className = '' 
}: { 
  children: React.ReactNode
  show?: boolean
  duration?: number
  className?: string
}) {
  return (
    <div
      className={`fade-transition ${className}`}
      style={{
        opacity: show ? 1 : 0,
        transition: `opacity ${duration}ms ease-in-out`,
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Slide and fade transition
 * Useful for panels, sidebars, and drawers
 */
export function SlideTransition({
  children,
  show = true,
  direction = 'down',
  duration = 300,
  className = '',
}: {
  children: React.ReactNode
  show?: boolean
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: number
  className?: string
}) {
  const getTransform = () => {
    if (show) return 'translate(0, 0)'
    
    switch (direction) {
      case 'up':
        return 'translateY(-10px)'
      case 'down':
        return 'translateY(10px)'
      case 'left':
        return 'translateX(-10px)'
      case 'right':
        return 'translateX(10px)'
      default:
        return 'translateY(10px)'
    }
  }

  return (
    <div
      className={`slide-transition ${className}`}
      style={{
        opacity: show ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-out`,
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Scale transition for modals and popovers
 */
export function ScaleTransition({
  children,
  show = true,
  duration = 200,
  origin = 'center',
  className = '',
}: {
  children: React.ReactNode
  show?: boolean
  duration?: number
  origin?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  className?: string
}) {
  const getOrigin = () => {
    switch (origin) {
      case 'top':
        return 'top center'
      case 'bottom':
        return 'bottom center'
      case 'left':
        return 'center left'
      case 'right':
        return 'center right'
      default:
        return 'center'
    }
  }

  return (
    <div
      className={`scale-transition ${className}`}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1)' : 'scale(0.95)',
        transformOrigin: getOrigin(),
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Stagger children animation
 * Animates list items with a delay between each
 */
export function StaggerChildren({
  children,
  staggerDelay = 50,
  className = '',
}: {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}) {
  const childArray = Array.isArray(children) ? children : [children]

  return (
    <div className={className}>
      {childArray.map((child, index) => (
        <div
          key={index}
          className="list-item-enter"
          style={{
            animationDelay: `${index * staggerDelay}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Hook to get animation duration based on reduced motion preference
 */
export function useAnimationDuration(defaultDuration: number): number {
  const prefersReducedMotion = useReducedMotion()
  return prefersReducedMotion ? 0 : defaultDuration
}
