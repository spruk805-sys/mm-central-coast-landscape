import { GeofenceService } from './geofence-service';
import { TimeClockService } from './time-clock';
import { Agent } from '../site-manager/types';

export interface PersonnelAlert {
  employeeId: string;
  type: 'OOB' | 'GHOST';
  message: string;
  severity: 'high' | 'medium';
  timestamp: Date;
}

export class DeploymentAgent implements Agent {
  name = 'Deployment Sentinel';
  private geofence: GeofenceService;
  private timeClock: TimeClockService;

  constructor(geofence: GeofenceService, timeClock: TimeClockService) {
    this.geofence = geofence;
    this.timeClock = timeClock;
  }

  async start(): Promise<void> {
    console.log('[DeploymentAgent] Sentinel initialized and monitoring personnel...');
  }

  async stop(): Promise<void> {
    console.log('[DeploymentAgent] Sentinel shutting down.');
  }

  getStatus() {
    const alerts = this.getPersonnelAlerts();
    return {
      healthy: true,
      details: {
        activeAlerts: alerts.length,
        alertSummary: alerts.map(a => `${a.employeeId}: ${a.type}`)
      }
    };
  }

  /**
   * Monitor for internal inconsistencies:
   * 1. GHOST: Employee is at a site but NOT clocked in.
   * 2. OOB: Employee is clocked in but NOT at a site (Out of Bounds).
   */
  getPersonnelAlerts(): PersonnelAlert[] {
    const alerts: PersonnelAlert[] = [];
    const fleet = this.geofence.getFleetStatus();

    fleet.forEach(member => {
      const activeShift = this.timeClock.getActiveShift(member.employeeId);
      const isAtSite = !!member.siteId;

      // 1. GHOST DETECTION: At site + No active shift
      if (isAtSite && !activeShift) {
        alerts.push({
          employeeId: member.employeeId,
          type: 'GHOST',
          severity: 'medium',
          message: `Personnel detected at ${member.siteName} without active synchronization (Clock-In missing).`,
          timestamp: new Date()
        });
      }

      // 2. OOB DETECTION: Active shift + Not at site
      if (activeShift && !isAtSite) {
        alerts.push({
          employeeId: member.employeeId,
          type: 'OOB',
          severity: 'high',
          message: `Synchronization anomaly: Personnel clocked in for site ${activeShift.jobSiteId} but is currently outside tactical perimeter.`,
          timestamp: new Date()
        });
      }
    });

    return alerts;
  }
}
