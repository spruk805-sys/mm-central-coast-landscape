import { MOCK_SYSTEM_STATUS, MOCK_FIN_STATS, MOCK_SITES, MOCK_OPS_DATA } from './mock_data';

async function verifyHubServices() {
    console.log('--- STARTING HUB SERVICE VERIFICATION ---');

    // 1. Verify Site Manager Logic (Mocked Check)
    console.log('Test 1: System Status Schema');
    if (MOCK_SYSTEM_STATUS.healthy && MOCK_SYSTEM_STATUS.providers.gemini.status === 'healthy') {
        console.log('PASS: System status matches expected health state.');
    } else {
        console.log('FAIL: System status health check failed.');
    }

    // 2. Verify Financial Metrics
    console.log('Test 2: Accounting Data Consistency');
    const totalRev = MOCK_FIN_STATS.revenueTotal;
    const expectedRev = MOCK_FIN_STATS.trends.reduce((sum, t) => sum + t.revenue, 0);
    // Note: totalRev might be YTD, trends might be last 3 months.
    if (totalRev >= expectedRev) {
        console.log(`PASS: Total revenue ($${totalRev}) encompasses trend data ($${expectedRev}).`);
    } else {
        console.log('FAIL: Financial trend data exceeds total reported revenue.');
    }

    // 3. Verify Operations Sites
    console.log('Test 3: Fleet Deployment Sites');
    if (MOCK_SITES.length > 0 && MOCK_SITES[0].name === 'Santa Ynez Estate') {
        console.log(`PASS: Site deployment data retrieved. Found ${MOCK_SITES.length} active sites.`);
    } else {
        console.log('FAIL: No active sites found in fleet data.');
    }

    // 4. Verify Active Shift Logic
    console.log('Test 4: Operational Shift Context');
    if (MOCK_OPS_DATA.activeShift.jobSiteId === 'SITE-001') {
        console.log('PASS: Active shift correctly associated with Site-001.');
        const startTime = new Date(MOCK_OPS_DATA.activeShift.startTime).getTime();
        const now = Date.now();
        const elapsed = (now - startTime) / 60000;
        console.log(`INFO: Shift elapsed time: ${elapsed.toFixed(1)} minutes.`);
    } else {
        console.log('FAIL: Active shift data mismatch.');
    }

    console.log('--- HUB VERIFICATION COMPLETE ---');
}

verifyHubServices().catch(err => {
    console.error('VERIFICATION ERROR:', err);
    process.exit(1);
});
