import React from 'react'

/**
 * Performance monitoring utilities for tracking component render times
 * and identifying performance bottlenecks
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private marks: Map<string, number> = new Map()

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
