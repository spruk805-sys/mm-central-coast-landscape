import { StorageService } from '../storage';

export interface ActivityLog {
  task: string;
  durationMinutes: number;
  timestamp: Date;
  featureId?: string;
}

export interface EmployeeJobLog {
  id: string;
  employeeId: string;
  siteId: string;
  date: string; // ISO Date YYYY-MM-DD
  activities: ActivityLog[];
  totalSiteTimeMinutes: number;
}

export class JobHistoryService {
  private logs: Map<string, EmployeeJobLog> = new Map();
  private storage = new StorageService('operations/jobhistory');

  constructor() {
    this.loadLogs();
  }

  private loadLogs(): void {
    const data = this.storage.list<EmployeeJobLog>();
    data.forEach(log => this.logs.set(log.id, log));
  }

  /**
   * Log an activity for an employee session
   */
  async recordActivity(employeeId: string, siteId: string, activityName: string, duration: number, featureId?: string) {
    const dateStr = new Date().toISOString().split('T')[0];
    const logId = `${employeeId}-${siteId}-${dateStr}`;

    let log = this.logs.get(logId);
    if (!log) {
      log = {
        id: logId,
        employeeId,
        siteId,
        date: dateStr,
        activities: [],
        totalSiteTimeMinutes: 0
      };
    }

    // Update existing activity if same, or add new
    const existing = log.activities.find(a => a.task === activityName && a.featureId === featureId);
    if (existing) {
      existing.durationMinutes += duration;
      existing.timestamp = new Date();
    } else {
      log.activities.push({
        task: activityName,
        durationMinutes: duration,
        timestamp: new Date(),
        featureId
      });
    }

    log.totalSiteTimeMinutes += duration;
    this.logs.set(logId, log);
    this.storage.save(logId, log);
  }

  getEmployeeHistory(employeeId: string): EmployeeJobLog[] {
    return Array.from(this.logs.values()).filter(l => l.employeeId === employeeId);
  }

  getSiteHistory(siteId: string): EmployeeJobLog[] {
    return Array.from(this.logs.values()).filter(l => l.siteId === siteId);
  }
  
  getAllHistory(): EmployeeJobLog[] {
    return Array.from(this.logs.values());
  }
}
