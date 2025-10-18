/**
 * Cron Service Initialization
 * This file initializes the cron service when the application starts
 */

import { cronService } from '@/services/cron';

let initialized = false;

/**
 * Initialize cron service
 * Should be called once when the application starts
 */
export async function initializeCronService() {
  if (initialized) {
    console.log('Cron service already initialized');
    return;
  }

  try {
    console.log('Starting cron service initialization...');
    await cronService.initialize();
    initialized = true;
    console.log('Cron service started successfully');
  } catch (error) {
    console.error('Failed to initialize cron service:', error);
    // Don't throw - allow app to continue even if cron fails
  }
}

/**
 * Shutdown cron service
 * Should be called when the application is shutting down
 */
export function shutdownCronService() {
  if (!initialized) {
    return;
  }

  try {
    console.log('Shutting down cron service...');
    cronService.stopAll();
    initialized = false;
    console.log('Cron service stopped');
  } catch (error) {
    console.error('Failed to shutdown cron service:', error);
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownCronService);
  process.on('SIGINT', shutdownCronService);
}
