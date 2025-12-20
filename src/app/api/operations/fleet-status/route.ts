import { NextResponse } from 'next/server';
import { getOperationsManager } from '@/services/operations/manager';

export async function GET() {
  try {
    const ops = getOperationsManager();
    const geofence = ops.getGeofenceService();
    const timeClock = ops.getTimeClockService();
    
    // Get live status from geofence service
    const fleet = geofence.getFleetStatus();
    
    // Combine with active shifts for richer data
    const activeFleet = fleet.filter(f => timeClock.getActiveShift(f.employeeId));

    return NextResponse.json({ 
      success: true, 
      activeFleet,
      allSites: geofence.getAllSites()
    });
  } catch (_) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
