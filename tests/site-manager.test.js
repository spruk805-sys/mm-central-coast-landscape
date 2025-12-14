/**
 * Site Manager Tests
 * 
 * Run with: node tests/site-manager.test.js
 */

const API_URL = "http://localhost:3000/api/site-manager/status";

async function runTests() {
  console.log("🧪 Site Manager Tests\n" + "━".repeat(50) + "\n");
  
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

  // Test 1: Status endpoint returns success
  await test("Status endpoint returns success", async () => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("success should be true");
  });

  // Test 2: Health status is boolean
  await test("Health status is boolean", async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (typeof data.healthy !== "boolean") throw new Error("healthy should be boolean");
  });

  // Test 3: Providers object exists
  await test("Providers object contains gemini and openai", async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (!data.providers.gemini) throw new Error("gemini provider missing");
    if (!data.providers.openai) throw new Error("openai provider missing");
  });

  // Test 4: Metrics structure
  await test("Metrics has required fields", async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    const m = data.metrics;
    if (typeof m.totalRequests !== "number") throw new Error("totalRequests missing");
    if (typeof m.averageLatencyMs !== "number") throw new Error("averageLatencyMs missing");
    if (typeof m.rateLimitHits !== "number") throw new Error("rateLimitHits missing");
  });

  // Test 5: Uptime is positive
  await test("Uptime is positive number", async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (typeof data.uptime !== "number" || data.uptime < 0) throw new Error("uptime invalid");
  });

  // Test 6: startedAt is valid date
  await test("startedAt is valid ISO date", async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    const d = new Date(data.startedAt);
    if (isNaN(d.getTime())) throw new Error("startedAt is not valid date");
  });

  // Test 7: Provider health status
  await test("Provider health status is valid", async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    const validStatus = ["healthy", "degraded", "down"];
    for (const [name, p] of Object.entries(data.providers)) {
      if (!validStatus.includes(p.status)) {
        throw new Error(`${name} has invalid status: ${p.status}`);
      }
    }
  });

  // Test 8: Queue depth is number
  await test("Queue depth is non-negative", async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (typeof data.queueDepth !== "number" || data.queueDepth < 0) {
      throw new Error("queueDepth invalid");
    }
  });

  // Summary
  console.log("\n" + "━".repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) process.exit(1);
}

runTests().catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});
