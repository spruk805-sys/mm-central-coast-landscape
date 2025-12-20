import { GeoPoint, JobSite, GeofenceEvent } from './types';
import { StorageService } from '../storage';

export class GeofenceService {
  private activeSites: Map<string, JobSite> = new Map();
  private events: GeofenceEvent[] = [];
  private lastKnownLocations: Map<string, { location: GeoPoint; timestamp: Date; siteId?: string }> = new Map();
  private storage = new StorageService('operations/sites');

  constructor() {
    this.loadSites();
    
    // Default site if none exists
    if (this.activeSites.size === 0) {
      this.addSite({
        id: 'site-1',
        name: 'HQ - Equipment Yard',
        center: { lat: 34.4208, lng: -119.6982 }, // Santa Barbara
        radiusMeters: 100,
        active: true,
        features: [
          { id: 'f1-1', label: 'Main Lawn', type: 'lawn', center: { lat: 34.4209, lng: -119.6983 }, radiusMeters: 20 },
          { id: 'f1-2', label: 'Solar Roof', type: 'solar', center: { lat: 34.4207, lng: -119.6981 }, radiusMeters: 15 }
        ]
      });
      // Add a few more mock sites for production feel
      this.addSite({
        id: 'site-2',
        name: 'Santa Ynez Estate',
        center: { lat: 34.6041, lng: -120.0601 },
        radiusMeters: 250,
        active: true,
        features: [
          { id: 'f2-1', label: 'North Lawn', type: 'lawn', center: { lat: 34.6042, lng: -120.0602 }, radiusMeters: 40 },
          { id: 'f2-2', label: 'Solar Field', type: 'solar', center: { lat: 34.6039, lng: -120.0599 }, radiusMeters: 50 },
          { id: 'f2-3', label: 'Rose Garden', type: 'garden', center: { lat: 34.6045, lng: -120.0605 }, radiusMeters: 30 }
        ]
      });
      this.addSite({
        id: 'site-3',
        name: 'Solvang Square',
        center: { lat: 34.5958, lng: -120.1376 },
        radiusMeters: 150,
        active: true
      });
    }
  }

  private loadSites(): void {
    const sites = this.storage.list<JobSite>();
    sites.forEach(s => this.activeSites.set(s.id, s));
  }

  addSite(site: JobSite): void {
    this.activeSites.set(site.id, site);
    this.storage.save(site.id, site);
  }

  getSite(id: string): JobSite | undefined {
    return this.activeSites.get(id);
  }

  getAllSites(): JobSite[] {
    return Array.from(this.activeSites.values());
  }

  /**
   * Check if a point is within a job site's geofence
   */
  isWithinGeofence(location: GeoPoint, siteId: string): boolean {
    const site = this.activeSites.get(siteId);
    if (!site) return false;

    const distance = this.calculateDistance(location, site.center);
    return distance <= site.radiusMeters;
  }

  /**
   * Find all sites that contain the given location
   */
  findSitesAtLocation(location: GeoPoint): JobSite[] {
    const matchedSites: JobSite[] = [];
    for (const site of this.activeSites.values()) {
      if (this.calculateDistance(location, site.center) <= site.radiusMeters) {
        matchedSites.push(site);
      }
    }
    return matchedSites;
  }

  /**
   * Haversine formula to calculate distance in meters
   */
  private calculateDistance(p1: GeoPoint, p2: GeoPoint): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = p1.lat * Math.PI / 180;
    const phi2 = p2.lat * Math.PI / 180;
    const deltaPhi = (p2.lat - p1.lat) * Math.PI / 180;
    const deltaLambda = (p2.lng - p1.lng) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Record a geofence event and update presence
   */
  recordEvent(employeeId: string, siteId: string, type: 'enter' | 'exit', location: GeoPoint): GeofenceEvent {
    const event: GeofenceEvent = {
      id: Math.random().toString(36).substring(7),
      employeeId,
      jobSiteId: siteId,
      type,
      timestamp: new Date(),
      location
    };
    this.events.push(event);
    
    // Update presence tracking
    this.lastKnownLocations.set(employeeId, {
      location,
      timestamp: event.timestamp,
      siteId: type === 'enter' ? siteId : undefined
    });

    console.log(`[Geofence] Employee ${employeeId} ${type}ed site ${siteId}`);
    return event;
  }

  updateLocation(employeeId: string, location: GeoPoint) {
    const entry = this.lastKnownLocations.get(employeeId);
    this.lastKnownLocations.set(employeeId, {
      location,
      timestamp: new Date(),
      siteId: entry?.siteId // Preserve site if already entered
    });
  }

  getFleetStatus() {
    return Array.from(this.lastKnownLocations.entries()).map(([employeeId, data]) => ({
      employeeId,
      ...data,
      siteName: data.siteId ? this.activeSites.get(data.siteId)?.name : 'Transit'
    }));
  }
}
