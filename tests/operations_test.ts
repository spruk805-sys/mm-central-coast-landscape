import { GeofenceService } from '../src/services/operations/geofence-service';
import { TimeClockService } from '../src/services/operations/time-clock';

async function runTests() {
  console.log('--- STARTING OPERATIONAL TESTS ---');

  const geofence = new GeofenceService();
  const timeClock = new TimeClockService(geofence);

  const employeeId = 'TEST-EMP';
  const hqLocation = { lat: 34.4208, lng: -119.6982 }; // At HQ
  const remoteLocation = { lat: 34.5000, lng: -120.0000 }; // Far away

  console.log('Test 1: Clock in far away (Should fail)');
  const res1 = await timeClock.clockIn(employeeId, remoteLocation);
  console.log(res1.success ? 'FAIL: Allowed clock-in far away' : 'PASS: Denied clock-in far away');

  console.log('Test 2: Clock in at HQ (Should succeed)');
  const res2 = await timeClock.clockIn(employeeId, hqLocation);
  console.log(res2.success ? 'PASS: Allowed clock-in at HQ' : `FAIL: Denied clock-in at HQ - ${res2.message}`);

  console.log('Test 3: Already clocked in check');
  const res3 = await timeClock.clockIn(employeeId, hqLocation);
  console.log(res3.success ? 'FAIL: Allowed double clock-in' : 'PASS: Denied double clock-in');

  console.log('Test 4: Clock out');
  const res4 = await timeClock.clockOut(employeeId, hqLocation);
  const duration = res4.entry?.durationMinutes ?? 0;
  console.log(res4.success ? `PASS: Clocked out. Duration: ${duration.toFixed(2)} mins` : 'FAIL: Could not clock out');

  console.log('Test 5: Clock out without active shift');
  const res5 = await timeClock.clockOut(employeeId);
  console.log(res5.success ? 'FAIL: Allowed clock-out without shift' : 'PASS: Denied clock-out without shift');

  console.log('--- TESTS COMPLETE ---');
}

runTests().catch(console.error);
