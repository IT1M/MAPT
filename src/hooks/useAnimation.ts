'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to get animation duration based on reduced motion preference
 */
export function useAnimationDuration(defaultDuration: number): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? 0 : defaultDuration;
}

/**
 * Hook to trigger animations on mount
 */
export function useAnimateOnMount(animationClass: string, delay = 0) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setShouldAnimate(true);
      return;
    }

    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, prefersReducedMotion]);

  return shouldAnimate ? animationClass : '';
}

/**
 * Hook to manage dropdown animation state
 */
export function useDropdownAnimation(isOpen: boolean) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animationClass, setAnimationClass] = useState('');
  const prefersReducedMotion = useReducedMotion();
  const duration = useAnimationDuration(150);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure element is in DOM before animation
      requestAnimationFrame(() => {
        setAnimationClass(prefersReducedMotion ? '' : 'dropdown-enter');
      });
    } else {
      setAnimationClass(prefersReducedMotion ? '' : 'dropdown-exit');
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, prefersReducedMotion]);

  return { shouldRender, animationClass };
}

/**
 * Hook to manage modal animation state
 */
export function useModalAnimation(isOpen: boolean) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [backdropClass, setBackdropClass] = useState('');
  const [contentClass, setContentClass] = useState('');
  const prefersReducedMotion = useReducedMotion();
  const duration = useAnimationDuration(200);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        if (!prefersReducedMotion) {
          setBackdropClass('modal-backdrop-enter');
          setContentClass('modal-content-enter');
        }
      });
    } else {
      if (!prefersReducedMotion) {
        setBackdropClass('modal-backdrop-exit');
        setContentClass('modal-content-exit');
      }
      const timer = setTimeout(() => {
        setShouldRender(false);
        setBackdropClass('');
        setContentClass('');
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, prefersReducedMotion]);

  return { shouldRender, backdropClass, contentClass };
}

/**
 * Hook to manage toast animation state
 */
export function useToastAnimation(isVisible: boolean) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState('');
  const prefersReducedMotion = useReducedMotion();
  const duration = useAnimationDuration(200);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setAnimationClass(prefersReducedMotion ? '' : 'toast-enter');
      });
    } else {
      setAnimationClass(prefersReducedMotion ? '' : 'toast-exit');
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, prefersReducedMotion]);

  return { shouldRender, animationClass };
}

/**
 * Hook to trigger animation on value change
 */
export function useAnimateOnChange<T>(
  value: T,
  animationClass: string,
  duration = 500
) {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef<T>(value);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    if (prevValueRef.current !== value) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, duration);

      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value, duration, prefersReducedMotion]);

  return isAnimating ? animationClass : '';
}

/**
 * Hook to stagger animations for list items
 */
export function useStaggerAnimation(itemCount: number, staggerDelay = 50) {
  const [visibleItems, setVisibleItems] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleItems(itemCount);
      return;
    }

    setVisibleItems(0);
    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i < itemCount; i++) {
      const timer = setTimeout(() => {
        setVisibleItems((prev) => prev + 1);
      }, i * staggerDelay);
      timers.push(timer);
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [itemCount, staggerDelay, prefersReducedMotion]);

  return visibleItems;
}

/**
 * Hook to manage sidebar animation state
 */
export function useSidebarAnimation(isOpen: boolean, isMobile: boolean) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animationClass, setAnimationClass] = useState('');
  const prefersReducedMotion = useReducedMotion();
  const duration = useAnimationDuration(300);

  useEffect(() => {
    if (!isMobile) {
      setShouldRender(true);
      setAnimationClass('');
      return;
    }

    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setAnimationClass(prefersReducedMotion ? '' : 'sidebar-enter');
      });
    } else {
      setAnimationClass(prefersReducedMotion ? '' : 'sidebar-exit');
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMobile, duration, prefersReducedMotion]);

  return { shouldRender, animationClass };
}

/**
 * Hook to add animation class on scroll
 */
export function useScrollAnimation(threshold = 100) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > threshold;
      if (scrolled !== hasScrolled) {
        setHasScrolled(scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, hasScrolled]);

  return hasScrolled;
}

/**
 * Hook to trigger shake animation (for errors)
 */
export function useShakeAnimation() {
  const [isShaking, setIsShaking] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const shake = useCallback(() => {
    if (prefersReducedMotion) return;

    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 500);
  }, [prefersReducedMotion]);

  return { isShaking, shake, className: isShaking ? 'animate-shake' : '' };
}

/**
 * Hook to trigger bounce animation (for attention)
 */
export function useBounceAnimation() {
  const [isBouncing, setIsBouncing] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const bounce = useCallback(() => {
    if (prefersReducedMotion) return;

    setIsBouncing(true);
    setTimeout(() => {
      setIsBouncing(false);
    }, 600);
  }, [prefersReducedMotion]);

  return { isBouncing, bounce, className: isBouncing ? 'animate-bounce' : '' };
}

/**
 * Hook to manage page transition loading state
 */
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const duration = useAnimationDuration(200);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, duration);
  }, [duration]);

  return {
    isTransitioning,
    startTransition,
    className:
      isTransitioning && !prefersReducedMotion
        ? 'page-transition-exit'
        : 'page-transition-enter',
  };
}

/**
 * Hook to add GPU acceleration hint
 */
export function useGPUAcceleration(shouldAccelerate: boolean) {
  const style = shouldAccelerate
    ? {
        transform: 'translateZ(0)',
        willChange: 'transform, opacity',
      }
    : {};

  return style;
}

/**
 * Hook to manage focus ring animation
 */
export function useFocusRingAnimation() {
  const [isFocused, setIsFocused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const focusProps = {
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    className: isFocused && !prefersReducedMotion ? 'focus-ring-animate' : '',
  };

  return focusProps;
}
