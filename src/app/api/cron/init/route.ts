/**
 * Cron Initialization API Route
 * This endpoint initializes the cron service
 * Should be called once when the application starts
 */

import { NextResponse } from 'next/server';
import { initializeCronService } from '@/lib/cron-init';

// Initialize cron service on module load (server-side only)
if (typeof window === 'undefined') {
  initializeCronService().catch(console.error);
}

export async function GET() {
  try {
    await initializeCronService();
    return NextResponse.json({
      success: true,
      message: 'Cron service initialized',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
