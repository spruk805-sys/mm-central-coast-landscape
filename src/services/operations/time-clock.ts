import { GeofenceService } from './geofence-service';
import { GeoPoint, Employee } from './types';
import { StorageService } from '../storage';

export interface TimeEntry {
  id: string;
  employeeId: string;
  jobSiteId: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  status: 'active' | 'completed';
}

export class TimeClockService {
  private geofenceService: GeofenceService;
  private timeEntries: Map<string, TimeEntry> = new Map(); // Key by entry ID
  private activeEntries: Map<string, string> = new Map(); // Key: employeeId, Value: entryId
  private storage = new StorageService('operations/timeclock');

  constructor(geofenceService: GeofenceService) {
    this.geofenceService = geofenceService;
    this.loadEntries();
  }

  private loadEntries(): void {
    const entries = this.storage.list<TimeEntry>();
    entries.forEach(entry => {
      // Ensure dates are correctly parsed
      entry.startTime = new Date(entry.startTime);
      if (entry.endTime) entry.endTime = new Date(entry.endTime);
      
      this.timeEntries.set(entry.id, entry);
      if (entry.status === 'active') {
        this.activeEntries.set(entry.employeeId, entry.id);
      }
    });
  }

  /**
   * Attempt to clock in an employee at a specific location
   */
  async clockIn(employeeId: string, location: GeoPoint): Promise<{ success: boolean; entry?: TimeEntry; message?: string }> {
    // 1. Check if already clocked in
    if (this.activeEntries.has(employeeId)) {
      return { success: false, message: 'Employee already clocked in.' };
    }

    // 2. Validate location against geofences
    const sites = this.geofenceService.findSitesAtLocation(location);
    if (sites.length === 0) {
      return { success: false, message: 'Not within any active job site geofence.' };
    }

    // Pick the closest or first site
    const site = sites[0];

    // 3. Create Time Entry
    const entry: TimeEntry = {
      id: Math.random().toString(36).substring(7),
      employeeId,
      jobSiteId: site.id,
      startTime: new Date(),
      status: 'active'
    };

    this.timeEntries.set(entry.id, entry);
    this.activeEntries.set(employeeId, entry.id);
    this.storage.save(entry.id, entry);

    // Record geofence event
    this.geofenceService.recordEvent(employeeId, site.id, 'enter', location);

    console.log(`[TimeClock] Employee ${employeeId} clocked in at ${site.name}`);
    return { success: true, entry };
  }

  /**
   * Clock out an employee
   */
  async clockOut(employeeId: string, location?: GeoPoint): Promise<{ success: boolean; entry?: TimeEntry; message?: string }> {
    const entryId = this.activeEntries.get(employeeId);
    if (!entryId) {
      return { success: false, message: 'No active shift found.' };
    }

    const entry = this.timeEntries.get(entryId);
    if (!entry) return { success: false, message: 'Entry record missing.' };

    entry.endTime = new Date();
    entry.durationMinutes = (entry.endTime.getTime() - entry.startTime.getTime()) / 60000;
    entry.status = 'completed';

    this.activeEntries.delete(employeeId);
    this.storage.save(entry.id, entry);

    // Record geofence event if location provided
    if (location) {
      this.geofenceService.recordEvent(employeeId, entry.jobSiteId, 'exit', location);
    }

    console.log(`[TimeClock] Employee ${employeeId} clocked out. Duration: ${entry.durationMinutes.toFixed(1)} mins`);
    return { success: true, entry };
  }

  getActiveShift(employeeId: string): TimeEntry | undefined {
    const entryId = this.activeEntries.get(employeeId);
    if (!entryId) return undefined;
    return this.timeEntries.get(entryId);
  }

  getAllEntries(): TimeEntry[] {
    return Array.from(this.timeEntries.values());
  }
}
