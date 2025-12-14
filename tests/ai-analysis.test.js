/**
 * AI Analysis API Tests - Comprehensive Suite
 * 
 * Run with: node tests/ai-analysis.test.js
 * Requires: Server running on localhost:3000
 */

const TEST_COORDS = {
  googleHQ: { lat: 37.4220, lng: -122.0841, address: "Google HQ" },
  residential: { lat: 34.0522, lng: -118.2437, address: "Los Angeles" },
  rural: { lat: 34.6145, lng: -120.0845, address: "Santa Ynez" },
};

const API_URL = "http://localhost:3000/api/analyze-property";

// Test utilities
const fetchWithTimeout = async (url, options, timeout = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

async function runTests() {
  console.log("🧪 AI Analysis API - Comprehensive Test Suite\n");
  console.log("━".repeat(60) + "\n");
  
  let passed = 0;
  let failed = 0;
  const results = [];

  const test = async (name, fn) => {
    process.stdout.write(`📋 ${name}... `);
    try {
      await fn();
      console.log("✅ PASS");
      passed++;
      results.push({ name, status: "pass" });
    } catch (e) {
      console.log(`❌ FAIL: ${e.message}`);
      failed++;
      results.push({ name, status: "fail", error: e.message });
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // SECTION 1: Basic API Tests
  // ═══════════════════════════════════════════════════════════════
  console.log("\n📁 SECTION 1: Basic API Response\n");

  await test("Returns success:true for valid request", async () => {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_COORDS.googleHQ),
    });
    const data = await res.json();
    if (data.success !== true) throw new Error(`success=${data.success}`);
  });

  await test("Returns 400 for missing lat/lng", async () => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: "Test" }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test("Returns 400 for invalid JSON", async () => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json",
    });
    if (res.status < 400) throw new Error(`Expected 4xx, got ${res.status}`);
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2: Analysis Structure Tests
  // ═══════════════════════════════════════════════════════════════
  console.log("\n📁 SECTION 2: Analysis Structure\n");

  await test("Analysis contains all required numeric fields", async () => {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_COORDS.residential),
    });
    const { analysis } = await res.json();
    
    const numericFields = ["lawnSqft", "treeCount", "bushCount", "fenceLength", "pathwaySqft", "gardenBeds"];
    for (const field of numericFields) {
      if (typeof analysis[field] !== "number") {
        throw new Error(`${field} should be number, got ${typeof analysis[field]}`);
      }
      if (analysis[field] < 0) {
        throw new Error(`${field} should be non-negative`);
      }
    }
  });

  await test("Analysis contains all required boolean fields", async () => {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_COORDS.googleHQ),
    });
    const { analysis } = await res.json();
    
    const boolFields = ["hasPool", "hasFence", "drivewayPresent"];
    for (const field of boolFields) {
      if (typeof analysis[field] !== "boolean") {
        throw new Error(`${field} should be boolean, got ${typeof analysis[field]}`);
      }
    }
  });

  await test("Confidence score is between 0 and 1", async () => {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_COORDS.googleHQ),
    });
    const { analysis } = await res.json();
    
    if (typeof analysis.confidence !== "number") throw new Error("confidence missing");
    if (analysis.confidence < 0 || analysis.confidence > 1) {
      throw new Error(`confidence ${analysis.confidence} not in [0,1]`);
    }
  });

  await test("Notes is a non-empty array of strings", async () => {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_COORDS.googleHQ),
    });
    const data = await res.json();
    const analysis = data.analysis;
    
    if (!analysis) throw new Error("analysis is undefined (API may have failed)");
    if (!Array.isArray(analysis.notes)) throw new Error("notes should be array");
    if (analysis.notes.length === 0) throw new Error("notes should not be empty");
    if (typeof analysis.notes[0] !== "string") throw new Error("notes[0] should be string");
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3: Boundary Path Tests
  // ═══════════════════════════════════════════════════════════════
  console.log("\n📁 SECTION 3: Boundary Path\n");

  await test("ImageUrl contains boundary path parameter", async () => {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_COORDS.googleHQ),
    });
    const { imageUrl } = await res.json();
    
    if (!imageUrl.includes("&path=")) throw new Error("Missing &path= parameter");
  });

  await test("Boundary path has valid color format", async () => {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_COORDS.rural),
    });
    const { imageUrl } = await res.json();
    
    // Should have color:0xRRGGBBAA format (red or orange)
    if (!imageUrl.match(/color:0x[0-9A-Fa-f]{8}/)) {
      throw new Error("Invalid color format in path");
    }
  });

  await test("Boundary path has minimum 4 coordinate points", async () => {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_COORDS.googleHQ),
    });
    const { imageUrl } = await res.json();
    
    // Extract coordinates (format: lat,lng|lat,lng|...)
    const matches = imageUrl.match(/\d+\.\d+,-?\d+\.\d+/g) || [];
    if (matches.length < 4) {
      throw new Error(`Expected ≥4 points, got ${matches.length}`);
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4: Provider & Metadata Tests
  // ═══════════════════════════════════════════════════════════════
  console.log("\n📁 SECTION 4: Provider & Metadata\n");

  await test("Provider field is present and valid", async () => {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_COORDS.googleHQ),
    });
    const { provider } = await res.json();
    
    if (!provider) throw new Error("provider missing");
    const valid = ["Gemini", "GPT-4o", "Consensus", "Fallback"];
    if (!valid.some(v => provider.includes(v))) {
      throw new Error(`Unknown provider: ${provider}`);
    }
  });

  await test("Parcel data structure is valid (or null)", async () => {
    const res = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_COORDS.googleHQ),
    });
    const { parcel } = await res.json();
    
    // Parcel can be null if Regrid has no data
    if (parcel !== null) {
      if (typeof parcel.sqft !== "number") throw new Error("parcel.sqft invalid");
      if (typeof parcel.acres !== "number") throw new Error("parcel.acres invalid");
    }
  });

  await test("Response time is under 30 seconds", async () => {
    const start = Date.now();
    await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_COORDS.rural),
    });
    const elapsed = Date.now() - start;
    
    if (elapsed > 30000) throw new Error(`Took ${elapsed}ms (>30s)`);
  });

  // ═══════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════
  console.log("\n" + "━".repeat(60));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    console.log("❌ Failed tests:");
    results.filter(r => r.status === "fail").forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
    console.log("");
    process.exit(1);
  } else {
    console.log("🎉 All tests passed!\n");
  }
}

runTests().catch(e => {
  console.error("Test runner error:", e);
  process.exit(1);
});
