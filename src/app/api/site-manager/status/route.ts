/**
 * Site Manager Status API
 * Returns current system health, metrics, and agent status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSiteManager } from '@/services/site-manager';

export async function GET(request: NextRequest) {
  try {
    const siteManager = getSiteManager();
    const status = siteManager.getStatus();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...status,
    });
  } catch (error) {
    console.error('[Status API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
