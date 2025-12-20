import { GeofenceService } from './geofence-service';
import { GeoPoint, SiteFeature } from './types';
import { Agent } from '../site-manager/types';

export interface InferredActivity {
  employeeId: string;
  siteId: string;
  activity: string;
  confidence: number;
  featureId?: string;
  startTime: Date;
}

export class ActivityAgent implements Agent {
  name = 'Activity Intelligence';
  private geofence: GeofenceService;
  private activeActivity: Map<string, InferredActivity> = new Map();

  constructor(geofence: GeofenceService) {
    this.geofence = geofence;
  }

  async start(): Promise<void> {
    console.log('[ActivityAgent] Tracking engine online.');
  }

  async stop(): Promise<void> {
    console.log('[ActivityAgent] Tracking engine offline.');
  }

  getStatus() {
    return {
      healthy: true,
      details: {
        activeTrackers: this.activeActivity.size,
        inferredTasks: Array.from(this.activeActivity.values()).map(a => `${a.employeeId}: ${a.activity}`)
      }
    };
  }

  /**
   * Infer activity based on current location and site features.
   */
  processTelemetry(employeeId: string, location: GeoPoint, siteId?: string): InferredActivity | null {
    if (!siteId) {
      this.activeActivity.delete(employeeId);
      return null;
    }

    const site = this.geofence.getSite(siteId);
    if (!site || !site.features) return null;

    // 1. Proximity Analysis
    let detectedFeature: SiteFeature | null = null;
    for (const feature of site.features) {
      const distance = this.calculateDistance(location, feature.center);
      if (distance <= feature.radiusMeters) {
        detectedFeature = feature;
        break;
      }
    }

    if (detectedFeature) {
      const activity = this.mapFeatureToActivity(detectedFeature.type);
      const current = this.activeActivity.get(employeeId);

      if (current?.activity === activity && current.featureId === detectedFeature.id) {
        // Continue existing activity
        return current;
      }

      // New activity detected
      const newActivity: InferredActivity = {
        employeeId,
        siteId,
        activity,
        confidence: 0.85, // Proximal match base confidence
        featureId: detectedFeature.id,
        startTime: new Date()
      };
      this.activeActivity.set(employeeId, newActivity);
      console.log(`[ActivityAgent] Inferred: Employee ${employeeId} is ${activity} at ${detectedFeature.label}`);
      return newActivity;
    }

    return null;
  }

  private mapFeatureToActivity(type: SiteFeature['type']): string {
    switch (type) {
      case 'lawn': return 'Mowing / Turf Care';
      case 'solar': return 'Cleaning Solar Arrays';
      case 'garden': return 'Pruning / Multi-trimming';
      case 'pool': return 'Pool System Maintenance';
      case 'driveway': return 'Pressure Washing / Clearing';
      case 'pathway': return 'Blowing / Debris Removal';
      default: return 'General Site Labor';
    }
  }

  private calculateDistance(p1: GeoPoint, p2: GeoPoint): number {
    const R = 6371e3;
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

  getActiveInferences(): InferredActivity[] {
    return Array.from(this.activeActivity.values());
  }
}
