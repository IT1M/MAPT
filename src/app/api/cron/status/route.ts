/**
 * Cron Status API Route
 * Returns the status of all cron jobs
 */

import { NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { cronService } from '@/services/cron';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get cron service status
    const status = cronService.getStatus();

    return NextResponse.json({
      success: true,
      status,
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
