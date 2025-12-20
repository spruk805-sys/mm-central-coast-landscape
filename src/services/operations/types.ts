/**
 * Operations Module Types
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface SiteFeature {
  id: string;
  label: string;
  type: 'lawn' | 'solar' | 'garden' | 'pool' | 'driveway' | 'pathway' | 'other';
  center: GeoPoint;
  radiusMeters: number;
}

export interface JobSite {
  id: string;
  name: string;
  center: GeoPoint;
  radiusMeters: number; // e.g. 50m, 100m
  active: boolean;
  features?: SiteFeature[];
}

export interface Employee {
  id: string;
  name: string;
  role: 'crew' | 'foreman' | 'admin';
  currentLocation?: GeoPoint;
  lastSeen?: Date;
}

export interface GeofenceEvent {
  id: string;
  employeeId: string;
  jobSiteId: string;
  type: 'enter' | 'exit';
  timestamp: Date;
  location: GeoPoint;
}
