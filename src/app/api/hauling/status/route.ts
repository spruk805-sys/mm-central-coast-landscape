/**
 * Hauling Manager Status API
 * Returns current system health and metrics
 */

import { NextResponse } from 'next/server';
import { getHaulingManager } from '@/services/hauling-manager';

export async function GET() {
  try {
    const manager = getHaulingManager();
    const status = manager.getStatus();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...status,
    });
  } catch (error) {
    console.error('[Hauling Status API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
