/**
 * Hauling Manager Tests
 * 
 * Run with: node tests/hauling-manager.test.js
 */

const STATUS_URL = "http://localhost:3000/api/hauling/status";
const PRICING_URL = "http://localhost:3000/api/hauling/pricing";

async function runTests() {
  console.log("🧪 Hauling Manager Tests\n" + "═".repeat(50) + "\n");
  
  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    process.stdout.write(`📋 ${name}... `);
    try {
      await fn();
      console.log("✅");
      passed++;
    } catch (e) {
      console.log(`❌ ${e.message}`);
      failed++;
    }
  };

  // Status API Tests
  console.log("📁 SECTION 1: Status API\n");

  await test("Status returns success", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    if (!data.success) throw new Error("success should be true");
  });

  await test("Status has agents object", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    if (!data.agents) throw new Error("agents missing");
  });

  await test("Status has metrics", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    if (typeof data.metrics.totalQuotes !== "number") throw new Error("totalQuotes missing");
  });

  await test("Status has uptime", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    if (typeof data.uptime !== "number") throw new Error("uptime missing");
  });

  // Pricing API Tests
  console.log("\n📁 SECTION 2: Pricing API\n");

  await test("Pricing returns success", async () => {
    const res = await fetch(PRICING_URL);
    const data = await res.json();
    if (!data.success) throw new Error("success should be true");
  });

  await test("Pricing has rates object", async () => {
    const res = await fetch(PRICING_URL);
    const data = await res.json();
    if (!data.rates) throw new Error("rates missing");
  });

  await test("Pricing has labor rate", async () => {
    const res = await fetch(PRICING_URL);
    const data = await res.json();
    if (typeof data.rates.laborPerHour !== "number") throw new Error("laborPerHour missing");
  });

  await test("Pricing has minimum charge", async () => {
    const res = await fetch(PRICING_URL);
    const data = await res.json();
    if (typeof data.rates.minimumCharge !== "number") throw new Error("minimumCharge missing");
  });

  // Summary
  console.log("\n" + "═".repeat(50));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) process.exit(1);
  console.log("🎉 All tests passed!\n");
}

runTests().catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});
