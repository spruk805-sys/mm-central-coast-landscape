import { GeofenceService } from './geofence-service';
import { Agent } from '../site-manager/types';

export class GPSAgent implements Agent {
  name = 'Geofence Guardian';
  private geofence: GeofenceService;

  constructor(geofence: GeofenceService) {
    this.geofence = geofence;
  }

  async start(): Promise<void> {
    console.log('[GPSAgent] Starting monitoring...');
  }

  async stop(): Promise<void> {
    console.log('[GPSAgent] Stopping monitoring...');
  }

  getStatus() {
    const fleet = this.geofence.getFleetStatus();
    return {
      healthy: true,
      details: {
        activeEmployees: fleet.length,
        locations: fleet.map(f => `${f.employeeId}: ${f.siteName}`)
      }
    };
  }

  /**
   * Get a narrative summary of fleet status for the dashboard
   */
  getNarrativeStatus(): string {
    const fleet = this.geofence.getFleetStatus();
    if (fleet.length === 0) return 'System standby. All units off-site or in transit.';
    
    const atSites = fleet.filter(f => f.siteId);
    if (atSites.length === 0) return `All ${fleet.length} active units are currently in transit between vectors.`;
    
    return `${atSites.length} tactical units currently active at job sites: ${atSites.map(f => f.siteName).join(', ')}.`;
  }
}
