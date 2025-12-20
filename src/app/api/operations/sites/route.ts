import { NextResponse } from 'next/server';
import { getOperationsManager } from '@/services/operations/manager';

/**
 * Returns all active job sites with geofence data
 */
export async function GET() {
  const geofence = getOperationsManager().getGeofenceService();
  const sites = geofence.getAllSites();
  return NextResponse.json({ sites });
}
