import React from 'react'
import { logger } from '@/services/logger'

/**
 * Performance monitoring utilities for tracking component render times,
 * Core Web Vitals, API response times, and identifying performance bottlenecks
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

interface APIPerformanceMetric {
  endpoint: string
  method: string
  duration: number
  status: number
  timestamp: number
  success: boolean
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private marks: Map<string, number> = new Map()
  private webVitals: WebVitalsMetric[] = []
  private apiMetrics: APIPerformanceMetric[] = []
  private isInitialized = false

  /**
   * Start measuring a performance metric
   */
  start(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * End measuring a performance metric
   */
  end(name: string): number | null {
    const startTime = this.marks.get(name)
    if (!startTime) {
      console.warn(`Performance mark "${name}" not found`)
      return null
    }

    const duration = performance.now() - startTime
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    })

    this.marks.delete(name)
    return duration
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      return result
    } finally {
      const duration = this.end(name)
      if (duration !== null && duration > 100) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
      }
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Get average duration for a metric
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name)
    if (metrics.length === 0) return 0

    const total = metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / metrics.length
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.marks.clear()
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const metricsByName = new Map<string, number[]>()

    this.metrics.forEach((metric) => {
      if (!metricsByName.has(metric.name)) {
        metricsByName.set(metric.name, [])
      }
      metricsByName.get(metric.name)!.push(metric.duration)
    })

    console.group('Performance Summary')
    metricsByName.forEach((durations, name) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      const min = Math.min(...durations)
      const max = Math.max(...durations)
      console.log(`${name}:`, {
        count: durations.length,
        avg: `${avg.toFixed(2)}ms`,
        min: `${min.toFixed(2)}ms`,
        max: `${max.toFixed(2)}ms`,
      })
    })
    console.groupEnd()
  }

  /**
   * Initialize Core Web Vitals tracking
   */
  initWebVitals(): void {
    if (typeof window === 'undefined' || this.isInitialized) {
      return
    }

    this.isInitialized = true

    // Use web-vitals library if available, otherwise use Performance Observer
    if ('PerformanceObserver' in window) {
      this.observeLCP()
      this.observeFID()
      this.observeCLS()
      this.observeFCP()
      this.observeTTFB()
    }

    logger.info('Web Vitals tracking initialized')
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   * Good: < 2.5s, Needs Improvement: 2.5s - 4s, Poor: > 4s
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any

        if (lastEntry) {
          const value = lastEntry.renderTime || lastEntry.loadTime
          this.recordWebVital('LCP', value)
        }
      })

      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch (error) {
      logger.warn('Failed to observe LCP', { error })
    }
  }

  /**
   * Observe First Input Delay (FID)
   * Good: < 100ms, Needs Improvement: 100ms - 300ms, Poor: > 300ms
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          const value = entry.processingStart - entry.startTime
          this.recordWebVital('FID', value)
        })
      })

      observer.observe({ type: 'first-input', buffered: true })
    } catch (error) {
      logger.warn('Failed to observe FID', { error })
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   * Good: < 0.1, Needs Improvement: 0.1 - 0.25, Poor: > 0.25
   */
  private observeCLS(): void {
    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            this.recordWebVital('CLS', clsValue)
          }
        })
      })

      observer.observe({ type: 'layout-shift', buffered: true })
    } catch (error) {
      logger.warn('Failed to observe CLS', { error })
    }
  }

  /**
   * Observe First Contentful Paint (FCP)
   * Good: < 1.8s, Needs Improvement: 1.8s - 3s, Poor: > 3s
   */
  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordWebVital('FCP', entry.startTime)
          }
        })
      })

      observer.observe({ type: 'paint', buffered: true })
    } catch (error) {
      logger.warn('Failed to observe FCP', { error })
    }
  }

  /**
   * Observe Time to First Byte (TTFB)
   * Good: < 800ms, Needs Improvement: 800ms - 1800ms, Poor: > 1800ms
   */
  private observeTTFB(): void {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as any
      if (navigationEntry) {
        const value = navigationEntry.responseStart - navigationEntry.requestStart
        this.recordWebVital('TTFB', value)
      }
    } catch (error) {
      logger.warn('Failed to observe TTFB', { error })
    }
  }

  /**
   * Record a Web Vital metric
   */
  private recordWebVital(name: WebVitalsMetric['name'], value: number): void {
    const rating = this.getRating(name, value)
    const metric: WebVitalsMetric = {
      name,
      value,
      rating,
      delta: value,
      id: `v3-${Date.now()}-${Math.random()}`,
      navigationType: 'navigate',
    }

    this.webVitals.push(metric)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Web Vital: ${name}`, {
        value: `${value.toFixed(2)}${name === 'CLS' ? '' : 'ms'}`,
        rating,
      })
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric)
    }
  }

  /**
   * Get rating for a Web Vital metric
   */
  private getRating(name: WebVitalsMetric['name'], value: number): WebVitalsMetric['rating'] {
    const thresholds: Record<WebVitalsMetric['name'], [number, number]> = {
      LCP: [2500, 4000],
      FID: [100, 300],
      CLS: [0.1, 0.25],
      FCP: [1800, 3000],
      TTFB: [800, 1800],
      INP: [200, 500],
    }

    const [good, poor] = thresholds[name]
    if (value <= good) return 'good'
    if (value <= poor) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Track API request performance
   */
  trackAPIRequest(
    endpoint: string,
    method: string,
    duration: number,
    status: number
  ): void {
    const metric: APIPerformanceMetric = {
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
      success: status >= 200 && status < 300,
    }

    this.apiMetrics.push(metric)

    // Log slow API requests
    if (duration > 3000) {
      logger.warn('Slow API request detected', {
        endpoint,
        method,
        duration: `${duration}ms`,
        status,
      })
    }

    // Log failed requests
    if (!metric.success) {
      logger.error('API request failed', new Error(`${method} ${endpoint} returned ${status}`), {
        endpoint,
        method,
        duration: `${duration}ms`,
        status,
      })
    }
  }

  /**
   * Get API performance metrics
   */
  getAPIMetrics(): APIPerformanceMetric[] {
    return [...this.apiMetrics]
  }

  /**
   * Get average API response time
   */
  getAverageAPIResponseTime(endpoint?: string): number {
    const metrics = endpoint
      ? this.apiMetrics.filter((m) => m.endpoint === endpoint)
      : this.apiMetrics

    if (metrics.length === 0) return 0

    const total = metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / metrics.length
  }

  /**
   * Get Web Vitals metrics
   */
  getWebVitals(): WebVitalsMetric[] {
    return [...this.webVitals]
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: WebVitalsMetric): void {
    // Send to Vercel Analytics or other service
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va('event', {
        name: 'web-vital',
        data: {
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
        },
      })
    }
  }

  /**
   * Track database query performance (server-side)
   */
  trackDatabaseQuery(query: string, duration: number): void {
    if (duration > 1000) {
      logger.warn('Slow database query detected', {
        query: query.substring(0, 100), // Truncate long queries
        duration: `${duration}ms`,
      })
    }

    this.metrics.push({
      name: 'db-query',
      duration,
      timestamp: Date.now(),
    })
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    webVitals: WebVitalsMetric[]
    apiMetrics: {
      total: number
      averageResponseTime: number
      successRate: number
      slowRequests: number
    }
    componentMetrics: {
      slowestComponents: Array<{ name: string; avgDuration: number }>
    }
  } {
    const successfulRequests = this.apiMetrics.filter((m) => m.success).length
    const slowRequests = this.apiMetrics.filter((m) => m.duration > 3000).length

    const componentDurations = new Map<string, number[]>()
    this.metrics.forEach((metric) => {
      if (!componentDurations.has(metric.name)) {
        componentDurations.set(metric.name, [])
      }
      componentDurations.get(metric.name)!.push(metric.duration)
    })

    const slowestComponents = Array.from(componentDurations.entries())
      .map(([name, durations]) => ({
        name,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10)

    return {
      webVitals: this.getWebVitals(),
      apiMetrics: {
        total: this.apiMetrics.length,
        averageResponseTime: this.getAverageAPIResponseTime(),
        successRate: this.apiMetrics.length > 0
          ? (successfulRequests / this.apiMetrics.length) * 100
          : 100,
        slowRequests,
      },
      componentMetrics: {
        slowestComponents,
      },
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * React hook for measuring component render time
 */
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === 'undefined') return

  React.useEffect(() => {
    performanceMonitor.start(`${componentName}-render`)
    return () => {
      performanceMonitor.end(`${componentName}-render`)
    }
  })
}

/**
 * Higher-order component for measuring component performance
 */
export function withPerformanceMonitoring<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const name = componentName || Component.displayName || Component.name || 'Unknown'

  const WrappedComponent: React.FC<P> = (props: P) => {
    React.useEffect(() => {
      performanceMonitor.start(`${name}-mount`)
      return () => {
        performanceMonitor.end(`${name}-mount`)
      }
    }, [])

    return React.createElement(Component, props)
  }

  WrappedComponent.displayName = `withPerformanceMonitoring(${name})`

  return React.memo(WrappedComponent) as React.ComponentType<P>
}
