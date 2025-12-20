import { GeofenceService } from './geofence-service';
import { TimeClockService } from './time-clock';
import { GPSAgent } from './gps-agent';
import { DeploymentAgent } from './deployment-agent';
import { ActivityAgent } from './activity-agent';
import { JobHistoryService } from './job-history-service';

class OperationsManager {
  private geofence: GeofenceService;
  private timeClock: TimeClockService;
  private gpsAgent: GPSAgent;
  private deploymentAgent: DeploymentAgent;
  private activityAgent: ActivityAgent;
  private jobHistory: JobHistoryService;

  constructor() {
    this.geofence = new GeofenceService();
    this.timeClock = new TimeClockService(this.geofence);
    this.gpsAgent = new GPSAgent(this.geofence);
    this.deploymentAgent = new DeploymentAgent(this.geofence, this.timeClock);
    this.activityAgent = new ActivityAgent(this.geofence);
    this.jobHistory = new JobHistoryService();
  }

  getGeofenceService(): GeofenceService {
    return this.geofence;
  }

  getTimeClockService(): TimeClockService {
    return this.timeClock;
  }

  getGPSAgent(): GPSAgent {
    return this.gpsAgent;
  }

  getDeploymentAgent(): DeploymentAgent {
    return this.deploymentAgent;
  }

  getActivityAgent(): ActivityAgent {
    return this.activityAgent;
  }

  getJobHistoryService(): JobHistoryService {
    return this.jobHistory;
  }
}

// Singleton instance
let instance: OperationsManager | null = null;

export function getOperationsManager(): OperationsManager {
  if (!instance) {
    instance = new OperationsManager();
  }
  return instance;
}
