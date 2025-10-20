/**
 * Centralized Logging Service
 *
 * Provides structured logging with environment-aware log levels,
 * request tracking, and contextual metadata.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  stack?: string;
  environment: string;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableStructured: boolean;
  includeTimestamp: boolean;
}

class Logger {
  private config: LoggerConfig;
  private requestId: string | null = null;
  private userId: string | null = null;

  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private readonly levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
  };

  private readonly resetColor = '\x1b[0m';

  constructor() {
    const env = process.env.NODE_ENV || 'development';
    const logLevel =
      (process.env.LOG_LEVEL as LogLevel) ||
      (env === 'production' ? 'error' : 'debug');

    this.config = {
      minLevel: logLevel,
      enableConsole: true,
      enableStructured: env === 'production',
      includeTimestamp: true,
    };
  }

  /**
   * Set request ID for tracking requests across logs
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Clear request ID after request completion
   */
  clearRequestId(): void {
    this.requestId = null;
  }

  /**
   * Set user ID for tracking user-specific logs
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Clear user ID
   */
  clearUserId(): void {
    this.userId = null;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>
  ): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      }),
    };

    this.log(
      'error',
      message,
      errorContext,
      error instanceof Error ? error.stack : undefined
    );
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    stack?: string
  ): void {
    // Check if log level meets minimum threshold
    if (this.levelPriority[level] < this.levelPriority[this.config.minLevel]) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      ...(context && { context }),
      ...(this.requestId && { requestId: this.requestId }),
      ...(this.userId && { userId: this.userId }),
      ...(stack && { stack }),
    };

    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // In production, you might want to send logs to external service
    if (this.config.enableStructured) {
      this.logStructured(logEntry);
    }
  }

  /**
   * Format and output log to console
   */
  private logToConsole(entry: LogEntry): void {
    const color = this.levelColors[entry.level];
    const levelStr = entry.level.toUpperCase().padEnd(5);
    const timestamp = this.config.includeTimestamp
      ? `[${entry.timestamp.toISOString()}]`
      : '';

    const prefix = `${color}${levelStr}${this.resetColor} ${timestamp}`;
    const requestInfo = entry.requestId ? `[${entry.requestId}]` : '';
    const userInfo = entry.userId ? `[User: ${entry.userId}]` : '';

    console.log(`${prefix} ${requestInfo}${userInfo} ${entry.message}`);

    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('  Context:', JSON.stringify(entry.context, null, 2));
    }

    if (entry.stack) {
      console.log('  Stack:', entry.stack);
    }
  }

  /**
   * Output structured JSON log (for production logging services)
   */
  private logStructured(entry: LogEntry): void {
    // In production, this could send to services like:
    // - Vercel Log Drains
    // - Datadog
    // - Sentry
    // - CloudWatch
    // For now, output as JSON
    console.log(JSON.stringify(entry));
  }

  /**
   * Create a child logger with preset context
   */
  child(context: Record<string, any>): ChildLogger {
    return new ChildLogger(this, context);
  }
}

/**
 * Child logger that inherits from parent with additional context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private context: Record<string, any>
  ) {}

  debug(message: string, additionalContext?: Record<string, any>): void {
    this.parent.debug(message, { ...this.context, ...additionalContext });
  }

  info(message: string, additionalContext?: Record<string, any>): void {
    this.parent.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: Record<string, any>): void {
    this.parent.warn(message, { ...this.context, ...additionalContext });
  }

  error(
    message: string,
    error?: Error | unknown,
    additionalContext?: Record<string, any>
  ): void {
    this.parent.error(message, error, {
      ...this.context,
      ...additionalContext,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { LogLevel, LogEntry, LoggerConfig };
