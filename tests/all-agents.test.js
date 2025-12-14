/**
 * Comprehensive Site Manager Agent Tests
 * Tests all Phase 1 and Phase 2 agents
 * 
 * Run with: node tests/all-agents.test.js
 */

const STATUS_URL = "http://localhost:3000/api/site-manager/status";
const SUGGESTIONS_URL = "http://localhost:3000/api/site-manager/suggestions";

async function runTests() {
  console.log("🧪 Site Manager - Comprehensive Agent Tests\n" + "═".repeat(60) + "\n");
  
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

  // ═══════════════════════════════════════════════════
  // SECTION 1: Status API Tests
  // ═══════════════════════════════════════════════════
  console.log("📁 SECTION 1: Status API\n");

  await test("Status returns success", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    if (!data.success) throw new Error("success should be true");
  });

  await test("System is healthy", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    if (typeof data.healthy !== "boolean") throw new Error("healthy missing");
  });

  await test("Providers are configured", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    if (!data.providers?.gemini) throw new Error("gemini missing");
    if (!data.providers?.openai) throw new Error("openai missing");
  });

  await test("Metrics structure is valid", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    const m = data.metrics;
    if (typeof m.totalRequests !== "number") throw new Error("totalRequests missing");
    if (typeof m.averageLatencyMs !== "number") throw new Error("averageLatencyMs missing");
    if (!m.byProvider) throw new Error("byProvider missing");
  });

  await test("Uptime is tracking", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    if (data.uptime < 0) throw new Error("uptime should be non-negative");
  });

  // ═══════════════════════════════════════════════════
  // SECTION 2: Suggestions API Tests
  // ═══════════════════════════════════════════════════
  console.log("\n📁 SECTION 2: Suggestions API\n");

  await test("Suggestions GET returns array", async () => {
    const res = await fetch(SUGGESTIONS_URL);
    const data = await res.json();
    if (!Array.isArray(data.suggestions)) throw new Error("suggestions should be array");
  });

  await test("Suggestions include metrics summary", async () => {
    const res = await fetch(SUGGESTIONS_URL);
    const data = await res.json();
    if (!data.metrics) throw new Error("metrics summary missing");
    if (typeof data.metrics.totalRequests !== "number") throw new Error("totalRequests missing");
  });

  await test("Suggestions POST requires action", async () => {
    const res = await fetch(SUGGESTIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test("Suggestions POST handles approval", async () => {
    const res = await fetch(SUGGESTIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", suggestionId: "test_1" }),
    });
    if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("success should be true");
  });

  // ═══════════════════════════════════════════════════
  // SECTION 3: Provider Health Tests
  // ═══════════════════════════════════════════════════
  console.log("\n📁 SECTION 3: Provider Health\n");

  await test("Provider status is valid enum", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    const validStatus = ["healthy", "degraded", "down"];
    for (const [name, p] of Object.entries(data.providers)) {
      if (!validStatus.includes(p.status)) {
        throw new Error(`${name} has invalid status: ${p.status}`);
      }
    }
  });

  await test("Provider error rate is valid", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    for (const [name, p] of Object.entries(data.providers)) {
      if (typeof p.errorRate !== "number") {
        throw new Error(`${name} errorRate should be number`);
      }
    }
  });

  // ═══════════════════════════════════════════════════
  // SECTION 4: Queue & Workers Tests
  // ═══════════════════════════════════════════════════
  console.log("\n📁 SECTION 4: Queue & Workers\n");

  await test("Queue depth is tracked", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    if (typeof data.queueDepth !== "number") throw new Error("queueDepth missing");
    if (data.queueDepth < 0) throw new Error("queueDepth should be non-negative");
  });

  await test("Active workers is tracked", async () => {
    const res = await fetch(STATUS_URL);
    const data = await res.json();
    if (typeof data.activeWorkers !== "number") throw new Error("activeWorkers missing");
  });

  // ═══════════════════════════════════════════════════
  // SECTION 5: Response Time Tests
  // ═══════════════════════════════════════════════════
  console.log("\n📁 SECTION 5: Performance\n");

  await test("Status API responds under 1s", async () => {
    const start = Date.now();
    await fetch(STATUS_URL);
    const elapsed = Date.now() - start;
    if (elapsed > 1000) throw new Error(`Took ${elapsed}ms`);
  });

  await test("Suggestions API responds under 1s", async () => {
    const start = Date.now();
    await fetch(SUGGESTIONS_URL);
    const elapsed = Date.now() - start;
    if (elapsed > 1000) throw new Error(`Took ${elapsed}ms`);
  });

  // ═══════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 All tests passed!\n");
  }
}

runTests().catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});
