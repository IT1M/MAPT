'use client';

/**
 * Vercel Analytics Integration
 *
 * Integrates Vercel Web Analytics and Speed Insights
 *
 * To enable:
 * 1. Install packages: npm install @vercel/analytics @vercel/speed-insights
 * 2. Enable Analytics in Vercel dashboard (Settings > Analytics)
 * 3. Uncomment the imports and components below
 */

import { useEffect } from 'react';
import { logger } from '@/services/logger';

// Uncomment when packages are installed:
// import { Analytics } from '@vercel/analytics/react';
// import { SpeedInsights } from '@vercel/speed-insights/react';

export function VercelAnalytics() {
  useEffect(() => {
    // Log analytics initialization
    if (process.env.NODE_ENV === 'production') {
      logger.info('Vercel Analytics initialized');
    }
  }, []);

  // Return null for now - uncomment when packages are installed
  return null;

  // Uncomment when packages are installed:
  // return (
  //   <>
  //     <Analytics />
  //     <SpeedInsights />
  //   </>
  // );
}

/**
 * Track custom events to Vercel Analytics
 *
 * @example
 * trackEvent('button_click', { button: 'submit', page: 'contact' })
 */
export function trackEvent(
  name: string,
  properties?: Record<string, any>
): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Track with Vercel Analytics if available
  if ((window as any).va) {
    (window as any).va('event', {
      name,
      data: properties,
    });
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Analytics Event', {
      event: name,
      properties,
    });
  }
}

/**
 * Track page views
 */
export function trackPageView(
  path: string,
  properties?: Record<string, any>
): void {
  trackEvent('pageview', {
    path,
    ...properties,
  });
}

/**
 * Track user interactions
 */
export function trackInteraction(
  action: string,
  category: string,
  label?: string,
  value?: number
): void {
  trackEvent('interaction', {
    action,
    category,
    label,
    value,
  });
}

/**
 * Track errors for analytics
 */
export function trackError(error: Error, context?: Record<string, any>): void {
  trackEvent('error', {
    message: error.message,
    name: error.name,
    stack: error.stack?.substring(0, 500), // Truncate stack trace
    ...context,
  });
}

/**
 * Track performance metrics
 */
export function trackPerformance(
  metric: string,
  value: number,
  unit: string = 'ms'
): void {
  trackEvent('performance', {
    metric,
    value,
    unit,
  });
}
