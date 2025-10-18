/**
 * Animation Utilities Export
 * 
 * Central export point for all animation-related components and hooks.
 * Import from this file to access animation utilities throughout the app.
 * 
 * @example
 * import { PageTransition, useModalAnimation } from '@/components/layout/animations'
 */

// Components
export {
  PageTransition,
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  StaggerChildren,
  useReducedMotion as useReducedMotionFromComponent,
  useAnimationDuration as useAnimationDurationFromComponent,
} from './PageTransition'

// Hooks
export {
  useReducedMotion,
  useAnimationDuration,
  useAnimateOnMount,
  useDropdownAnimation,
  useModalAnimation,
  useToastAnimation,
  useAnimateOnChange,
  useStaggerAnimation,
  useSidebarAnimation,
  useScrollAnimation,
  useShakeAnimation,
  useBounceAnimation,
  usePageTransition,
  useGPUAcceleration,
  useFocusRingAnimation,
} from '@/hooks/useAnimation'

/**
 * Animation Duration Constants
 * Use these for consistent timing across the app
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
  VERY_SLOW: 500,
} as const

/**
 * Animation Easing Constants
 * CSS easing functions for different animation types
 */
export const ANIMATION_EASING = {
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  LINEAR: 'linear',
  SPRING: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const

/**
 * Animation Class Names
 * Pre-defined class names for common animations
 */
export const ANIMATION_CLASSES = {
  // Page transitions
  PAGE_ENTER: 'page-transition-enter',
  PAGE_EXIT: 'page-transition-exit',
  PAGE_SLIDE_UP: 'page-slide-up',

  // Dropdown animations
  DROPDOWN_ENTER: 'dropdown-enter',
  DROPDOWN_EXIT: 'dropdown-exit',
  DROPDOWN_SCALE_ENTER: 'dropdown-scale-enter',

  // Modal animations
  MODAL_BACKDROP_ENTER: 'modal-backdrop-enter',
  MODAL_BACKDROP_EXIT: 'modal-backdrop-exit',
  MODAL_CONTENT_ENTER: 'modal-content-enter',
  MODAL_CONTENT_EXIT: 'modal-content-exit',
  MODAL_MOBILE_ENTER: 'modal-mobile-enter',
  MODAL_MOBILE_EXIT: 'modal-mobile-exit',

  // Toast animations
  TOAST_ENTER: 'toast-enter',
  TOAST_EXIT: 'toast-exit',

  // Sidebar animations
  SIDEBAR_ENTER: 'sidebar-enter',
  SIDEBAR_EXIT: 'sidebar-exit',
  SIDEBAR_TRANSITION: 'sidebar-transition',

  // Loading animations
  SKELETON_PULSE: 'skeleton-pulse',
  SPIN: 'animate-spin',
  PROGRESS_INDETERMINATE: 'progress-indeterminate',
  DOTS_BOUNCE: 'dots-bounce',

  // Micro-interactions
  BUTTON_PRESS: 'button-press',
  HOVER_LIFT: 'hover-lift',
  FOCUS_RING_ANIMATE: 'focus-ring-animate',

  // Feedback animations
  CHECKMARK_DRAW: 'checkmark-draw',
  SHAKE: 'animate-shake',
  BOUNCE: 'animate-bounce',
  WIGGLE: 'animate-wiggle',

  // Badge animations
  BADGE_PULSE: 'badge-pulse',
  BELL_RING: 'bell-ring',

  // List animations
  LIST_ITEM_ENTER: 'list-item-enter',
  EXPAND_HEIGHT: 'expand-height',
  COLLAPSE_HEIGHT: 'collapse-height',

  // Utility classes
  TRANSITION_SMOOTH: 'transition-smooth',
  TRANSITION_FAST: 'transition-fast',
  TRANSITION_SLOW: 'transition-slow',
  GPU_ACCELERATED: 'gpu-accelerated',
  WILL_ANIMATE: 'will-animate',
  NO_ANIMATION: 'no-animation',
} as const

/**
 * Helper function to combine animation classes
 */
export function combineAnimationClasses(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Helper function to get animation duration based on reduced motion
 */
export function getAnimationDuration(
  duration: number,
  prefersReducedMotion: boolean
): number {
  return prefersReducedMotion ? 0 : duration
}

/**
 * Helper function to create stagger delay style
 */
export function getStaggerDelay(index: number, delay = 50): React.CSSProperties {
  return {
    animationDelay: `${index * delay}ms`,
  }
}

/**
 * Helper function to create transition style
 */
export function createTransitionStyle(
  properties: string[],
  duration: number,
  easing: string = ANIMATION_EASING.EASE_IN_OUT
): React.CSSProperties {
  return {
    transition: properties.map((prop) => `${prop} ${duration}ms ${easing}`).join(', '),
  }
}
