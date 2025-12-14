/**
 * Hauling Pricing API
 * Returns current pricing rates
 */

import { NextResponse } from 'next/server';
import { getHaulingManager } from '@/services/hauling-manager';

export async function GET() {
  try {
    const manager = getHaulingManager();
    const rates = manager.getRates();

    return NextResponse.json({
      success: true,
      rates,
    });
  } catch (error) {
    console.error('[Hauling Pricing API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get pricing' },
      { status: 500 }
    );
  }
}
