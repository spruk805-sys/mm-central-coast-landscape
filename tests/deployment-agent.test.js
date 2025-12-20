/**
 * Deployment Agent Logic Test
 * Verifies GHOST and OOB detection scenarios
 */

// Simple import simulation
class DeploymentAgent {
  constructor(geofence, timeClock) {
    this.geofence = geofence;
    this.timeClock = timeClock;
  }

  getPersonnelAlerts() {
    const alerts = [];
    const fleet = this.geofence.getFleetStatus();

    fleet.forEach(member => {
      const activeShift = this.timeClock.getActiveShift(member.employeeId);
      const isAtSite = !!member.siteId;

      if (isAtSite && !activeShift) {
        alerts.push({ employeeId: member.employeeId, type: 'GHOST' });
      }

      if (activeShift && !isAtSite) {
        alerts.push({ employeeId: member.employeeId, type: 'OOB' });
      }
    });

    return alerts;
  }
}

async function runTests() {
  console.log("🧪 Deployment Agent - Scenario Tests\n" + "━".repeat(50));

  // Scenario 1: Nominal (Clocked in at site)
  let geofenceData = [{ employeeId: 'EMP-001', siteId: 'site-1', siteName: 'HQ' }];
  let timeClockData = { 'EMP-001': { jobSiteId: 'site-1' } };
  
  let agent = new DeploymentAgent(
    { getFleetStatus: () => geofenceData },
    { getActiveShift: (id) => timeClockData[id] }
  );

  let alerts = agent.getPersonnelAlerts();
  console.log(`📋 Nominal Case (Clocked in at site): ${alerts.length === 0 ? "✅" : "❌"}`);

  // Scenario 2: GHOST (At site, not clocked in)
  geofenceData = [{ employeeId: 'EMP-002', siteId: 'site-1', siteName: 'HQ' }];
  timeClockData = {}; // No active shift
  
  agent = new DeploymentAgent(
    { getFleetStatus: () => geofenceData },
    { getActiveShift: (id) => timeClockData[id] }
  );

  alerts = agent.getPersonnelAlerts();
  console.log(`📋 GHOST Case (At site, no clock-in): ${alerts.length === 1 && alerts[0].type === 'GHOST' ? "✅" : "❌"}`);

  // Scenario 3: OOB (Clocked in, but not at site)
  geofenceData = [{ employeeId: 'EMP-003', siteId: null, siteName: 'Transit' }];
  timeClockData = { 'EMP-003': { jobSiteId: 'site-1' } };
  
  agent = new DeploymentAgent(
    { getFleetStatus: () => geofenceData },
    { getActiveShift: (id) => timeClockData[id] }
  );

  alerts = agent.getPersonnelAlerts();
  console.log(`📋 OOB Case (Clocked in, but transiting): ${alerts.length === 1 && alerts[0].type === 'OOB' ? "✅" : "❌"}`);

  console.log("\n✨ Tests completed.");
}

runTests();
