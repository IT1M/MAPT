/**
 * Responsive Design Utilities
 * Helpers for responsive layouts, breakpoints, and mobile optimization
 */

/**
 * Tailwind breakpoints
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): Breakpoint | null {
  if (typeof window === 'undefined') return null;

  const width = window.innerWidth;

  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';

  return null;
}

/**
 * Check if viewport is at or above breakpoint
 */
export function isBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
}

/**
 * Check if device is tablet
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg
  );
}

/**
 * Check if device is desktop
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
}

/**
 * Check if device has touch support
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get responsive value based on breakpoint
 */
export function getResponsiveValue<T>(values: {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T {
  const breakpoint = getCurrentBreakpoint();

  if (breakpoint === '2xl' && values['2xl']) return values['2xl'];
  if ((breakpoint === '2xl' || breakpoint === 'xl') && values.xl)
    return values.xl;
  if ((breakpoint === 'xl' || breakpoint === 'lg') && values.lg)
    return values.lg;
  if ((breakpoint === 'lg' || breakpoint === 'md') && values.md)
    return values.md;
  if ((breakpoint === 'md' || breakpoint === 'sm') && values.sm)
    return values.sm;

  return values.base;
}

/**
 * Responsive class generator
 */
export function responsiveClass(config: {
  base: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}): string {
  const classes: string[] = [config.base];

  if (config.sm) classes.push(`sm:${config.sm}`);
  if (config.md) classes.push(`md:${config.md}`);
  if (config.lg) classes.push(`lg:${config.lg}`);
  if (config.xl) classes.push(`xl:${config.xl}`);
  if (config['2xl']) classes.push(`2xl:${config['2xl']}`);

  return classes.join(' ');
}

/**
 * Container query helper
 */
export function useContainerQuery(containerRef: React.RefObject<HTMLElement>) {
  const [size, setSize] = React.useState<'sm' | 'md' | 'lg'>('lg');

  React.useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;

      if (width < 640) setSize('sm');
      else if (width < 1024) setSize('md');
      else setSize('lg');
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [containerRef]);

  return size;
}

/**
 * Viewport height fix for mobile browsers
 */
export function fixMobileViewportHeight(): void {
  if (typeof window === 'undefined') return;

  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
}

/**
 * Safe area insets for notched devices
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (
    typeof window === 'undefined' ||
    typeof getComputedStyle === 'undefined'
  ) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(
      style.getPropertyValue('env(safe-area-inset-right)') || '0'
    ),
    bottom: parseInt(
      style.getPropertyValue('env(safe-area-inset-bottom)') || '0'
    ),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
}

/**
 * Apply safe area padding
 */
export function applySafeAreaPadding(element: HTMLElement): void {
  element.style.paddingTop = 'env(safe-area-inset-top)';
  element.style.paddingRight = 'env(safe-area-inset-right)';
  element.style.paddingBottom = 'env(safe-area-inset-bottom)';
  element.style.paddingLeft = 'env(safe-area-inset-left)';
}

/**
 * Responsive font size calculator
 */
export function getResponsiveFontSize(
  minSize: number,
  maxSize: number,
  minWidth = 320,
  maxWidth = 1920
): string {
  const slope = (maxSize - minSize) / (maxWidth - minWidth);
  const yAxisIntersection = -minWidth * slope + minSize;

  return `clamp(${minSize}px, ${yAxisIntersection}px + ${slope * 100}vw, ${maxSize}px)`;
}

/**
 * Responsive spacing calculator
 */
export function getResponsiveSpacing(
  minSpacing: number,
  maxSpacing: number
): string {
  return getResponsiveFontSize(minSpacing, maxSpacing);
}

/**
 * Grid columns calculator based on container width
 */
export function getResponsiveColumns(
  containerWidth: number,
  minColumnWidth = 250
): number {
  return Math.max(1, Math.floor(containerWidth / minColumnWidth));
}

/**
 * Detect orientation
 */
export function getOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Check if device is in standalone mode (PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Responsive image srcset generator
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536]
): string {
  return widths.map((width) => `${baseUrl}?w=${width} ${width}w`).join(', ');
}

/**
 * Responsive sizes attribute generator
 */
export function generateSizes(config: {
  base: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}): string {
  const sizes: string[] = [];

  if (config.xl) sizes.push(`(min-width: ${BREAKPOINTS.xl}px) ${config.xl}`);
  if (config.lg) sizes.push(`(min-width: ${BREAKPOINTS.lg}px) ${config.lg}`);
  if (config.md) sizes.push(`(min-width: ${BREAKPOINTS.md}px) ${config.md}`);
  if (config.sm) sizes.push(`(min-width: ${BREAKPOINTS.sm}px) ${config.sm}`);
  sizes.push(config.base);

  return sizes.join(', ');
}

/**
 * Debounced resize observer
 */
export function createDebouncedResizeObserver(
  callback: (entry: ResizeObserverEntry) => void,
  delay = 150
): ResizeObserver {
  let timeoutId: NodeJS.Timeout;

  return new ResizeObserver((entries) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      entries.forEach(callback);
    }, delay);
  });
}

/**
 * React hook for window size
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  React.useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

/**
 * React hook for media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Add React import for hooks
import React from 'react';
