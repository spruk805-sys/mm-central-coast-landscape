
import { PropertyAnalysis } from "@/types/property";
import { getSAMAgent } from "./site-manager/sam-agent";
import { getBoundaryAgent, ParcelPolygon } from "./site-manager/boundary-agent";

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

// Parcel data from Regrid API
interface ParcelData {
  polygon?: ParcelPolygon;
  apn?: string;
  sqft?: number;
  acres?: number;
  dimensions?: {
    latFeet?: number;
    lngFeet?: number;
    perimeterFeet?: number;
  };
}

export interface AIAnalysisConfig {
  address: string;
  lat: number;
  lng: number;
  parcelData: ParcelData | null;
  satelliteImages: { mime: string; data: string; label: string }[];
  streetViewImages: { mime: string; data: string; label: string }[];
  userPhotos: { mime: string; data: string; label: string }[]; // Base64 strings
}

// Parse AI JSON response
const parseAIResponse = (textResponse: string, providerName: string): PropertyAnalysis => {
  try {
    const cleaned = textResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const json = JSON.parse(cleaned);
    
    // Extract observations
    const observations = json.imageObservations ? 
      Object.values(json.imageObservations).filter(Boolean).map(o => `[${providerName} OBS] ${o}`) : [];

    // Parse locations helper with debug logging
    const parseLocationsArray = (locs: any[], source: string): any[] => {
      if (!Array.isArray(locs)) return [];
      console.log(`[AI Parse] Processing ${locs.length} locations for ${source}`);
      return locs.map((loc: any, idx: number) => {
        if (loc.box_2d && Array.isArray(loc.box_2d) && loc.box_2d.length === 4) {
          const [yMin, xMin, yMax, xMax] = loc.box_2d;
          // Gemini returns 0-1000 scale, convert to 0-100%
          const result = { 
            type: loc.type || 'unknown', 
            x: xMin / 10, 
            y: yMin / 10, 
            w: Math.max(2, (xMax - xMin) / 10), 
            h: Math.max(2, (yMax - yMin) / 10) 
          };
          console.log(`[AI Parse] ${source} item ${idx}: type=${loc.type}, box_2d=[${yMin},${xMin},${yMax},${xMax}] → pos(${result.x.toFixed(1)}%, ${result.y.toFixed(1)}%)`);
          return result;
        }
        console.log(`[AI Parse] ${source} item ${idx}: using fallback position (no valid box_2d)`);
        return { type: loc.type || 'unknown', x: loc.x || 50, y: loc.y || 50, w: loc.w || 5, h: loc.h || 5 };
      });
    };

    // Handle new locationsByImage format
    const locationsByImage = json.locationsByImage ? {
      image1: parseLocationsArray(json.locationsByImage.image1 || [], 'image1'),
      image2: parseLocationsArray(json.locationsByImage.image2 || [], 'image2'),
      image3: parseLocationsArray(json.locationsByImage.image3 || [], 'image3'),
    } : undefined;

    // Legacy single locations array (for backwards compatibility)
    const locations = Array.isArray(json.locations) 
      ? parseLocationsArray(json.locations, 'legacy') 
      : (locationsByImage?.image1 || []);

    return {
      lawnSqft: Math.max(0, Math.round(json.lawnSqft || 0)),
      treeCount: Math.max(0, Math.round(json.treeCount || 0)),
      bushCount: Math.max(0, Math.round(json.bushCount || 0)),
      hasPool: Boolean(json.hasPool),
      hasFence: Boolean(json.hasFence),
      fenceLength: Math.max(0, Math.round(json.fenceLength || 0)),
      pathwaySqft: Math.max(0, Math.round(json.pathwaySqft || 0)),
      gardenBeds: Math.max(0, Math.round(json.gardenBeds || 0)),
      drivewayPresent: Boolean(json.drivewayPresent),
      confidence: Math.min(1, Math.max(0, json.confidence || 0.7)),
      notes: Array.isArray(json.notes) 
        ? [...observations, ...json.notes.map((n: string) => `[${providerName}] ${n}`)]
        : [...observations],
      locations,
      locationsByImage,
    };
  } catch {
    throw new Error(`Failed to parse ${providerName} response: ${textResponse.substring(0, 100)}...`);
  }
};

// OpenAI Implementation
const callOpenAI = async (promptText: string, images: { mime: string; data: string; label: string }[]): Promise<PropertyAnalysis> => {
  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey) throw new Error("OpenAI Key missing");

  // OpenAI doesn't support "interleaved" text/images as cleanly in the user message in all library versions, 
  // but the chat API supports an array of {type: text} | {type: image_url}.
  // We will interleave labels.
  
  const content: any[] = [{ type: "text", text: promptText }];
  
  images.forEach((img, index) => {
    content.push({ type: "text", text: `\n--- IMAGE ${index + 1}: ${img.label} ---\n` });
    content.push({
      type: "image_url",
      image_url: { 
        url: `data:${img.mime};base64,${img.data}`,
        detail: "high" 
      }
    });
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openAIKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content }],
      max_tokens: 1024,
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!res.ok) throw new Error(`OpenAI Status ${res.status}`);
  const data = await res.json();
  return parseAIResponse(data.choices[0].message.content, "GPT-4o");
};

// Gemini Implementation
const callGemini = async (apiKey: string, geminiParts: GeminiPart[]): Promise<PropertyAnalysis> => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: geminiParts }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    }
  );
  
  if (res.status === 429) throw new Error("Rate Limited");
  if (!res.ok) throw new Error(`Gemini Status ${res.status}`);
  
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty text");
  
  return parseAIResponse(text, "Gemini");
};

export const runConsensusAnalysis = async (config: AIAnalysisConfig): Promise<{ provider: string, analysis: PropertyAnalysis }> => {
  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) throw new Error("Gemini API Key missing");

  const startTime = Date.now();
  const allImages = [...config.satelliteImages, ...config.streetViewImages, ...config.userPhotos];
  
  // ========== STEP 1: RUN SAM 3 FIRST ==========
  // This gives us precise segmentation that helps AI understand property features
  console.log('[Consensus] STEP 1: Running SAM 3 segmentation first...');
  
  let samMasksByImage: PropertyAnalysis['samMasksByImage'] = undefined;
  let samSummary = '';
  
  try {
    const samAgent = getSAMAgent();
    const samStatus = samAgent.getStatus();
    
    if (samStatus.healthy && config.satelliteImages.length >= 3) {
      // Detect EVERYTHING - we'll filter to property boundary later
      const samPrompts = [
        'lawn grass',
        'tree',
        'bush shrub',
        'swimming pool',
        'fence',
        'driveway',
        'patio deck',
        'garden bed',
        'pathway walkway',
        'shed',
        'roof house',
        'solar panel', // For solar panel cleaning service
      ];
      
      // Process all 3 satellite images in parallel
      const samResults = await Promise.all(
        config.satelliteImages.slice(0, 3).map(async (img, idx) => {
          console.log(`[Consensus] SAM processing image ${idx + 1}...`);
          const masks = await samAgent.segmentWithText(img.data, samPrompts, img.mime);
          return { imageKey: `image${idx + 1}` as 'image1' | 'image2' | 'image3', masks };
        })
      );
      
      // Build samMasksByImage structure
      samMasksByImage = {};
      let totalMasks = 0;
      const featureCounts: Record<string, number> = {};
      
      for (const result of samResults) {
        if (result.masks.length > 0) {
          samMasksByImage[result.imageKey] = result.masks;
          totalMasks += result.masks.length;
          // Count detected features
          for (const mask of result.masks) {
            featureCounts[mask.type] = (featureCounts[mask.type] || 0) + 1;
          }
        }
      }
      
      // Build summary for AI prompt
      if (totalMasks > 0) {
        const featureList = Object.entries(featureCounts)
          .map(([type, count]) => `${type}: ${count}`)
          .join(', ');
        samSummary = `
**SAM 3 PRE-DETECTION RESULTS:**
✅ Automated segmentation detected: ${featureList}
🎯 These are pixel-accurate masks - use them to validate your counts.
⚠️ SAM may detect neighbor's features too - cross-check with parcel boundary!`;
        console.log(`[Consensus] SAM 3 detected: ${featureList}`);
      }
    }
  } catch (samError) {
    console.error('[Consensus] SAM pre-detection error (non-fatal):', samError);
  }

  // ========== STEP 2: BUILD AI PROMPT WITH SAM RESULTS ==========
  console.log('[Consensus] STEP 2: Running AI analysis with SAM context...');
  
  const parcelInfo = config.parcelData && config.parcelData.sqft
    ? `
**VERIFIED PARCEL BOUNDARY DATA (from Regrid.com):**
- APN: ${config.parcelData.apn || 'N/A'}
- Lot Size: ${config.parcelData.sqft?.toLocaleString() || 'Unknown'} sq ft (${config.parcelData.acres?.toFixed(2) || '?'} acres)
- Dimensions: ~${config.parcelData.dimensions?.latFeet || '?'}ft x ${config.parcelData.dimensions?.lngFeet || '?'}ft
- Perimeter: ${config.parcelData.dimensions?.perimeterFeet || '?'}ft
⚠️ USE THESE EXACT DIMENSIONS. Lawn < Lot Size.
`
    : `**PARCEL BOUNDARY:** No exact data. Estimate from visual landmarks.`;

  const analysisPrompt = `You are an expert landscaping property analyst. Analyze the following ${allImages.length} images of a SINGLE property.

**PROPERTY:**
Address: ${config.address || "Unknown"}
Coordinates: ${config.lat}, ${config.lng} (CENTER of property)
${parcelInfo}
${samSummary}

**INSTRUCTIONS:**
1. **Visual Inventory (MANDATORY)**: Analyze EACH image (labeled below). List 1 specific observation for each to prove you looked at it.

2. **🔴 BOUNDARY LINE (CRITICAL)**: 
   - On satellite images, a **COLORED POLYGON** is drawn showing the property boundary.
   - **RED LINE** = Exact legal parcel boundary from county records.
   - **ORANGE LINE** = Estimated boundary (~100ft centered on property).
   - **ONLY count features INSIDE this boundary line.** Everything outside belongs to neighbors — IGNORE IT.
   - Count trees, pools, lawn ONLY within the boundary.

3. **Cross-Reference Rule**: 
   - Image 1 (Zoom 21) is the TRUTH for identifying features.
   - If a feature (e.g., Pool) appears in Image 3 (Wide) but NOT in Image 1 (Close), it's outside the property — IGNORE IT.
   - For Street View: Focus ONLY on the property at the center, ignore houses across the street.

4. **Consensus with SAM**: If SAM detected features, validate which are INSIDE the property boundary.

**REQUIRED JSON OUTPUT:**
{
  "imageObservations": {
    "satellite": "Findings from aerial views...",
    "streetView": "Findings from street level...",
    "userPhotos": "Findings from provided photos..."
  },
  "locationsByImage": {
    "image1": [{ "type": "tree|bush|pool", "box_2d": [ymin, xmin, ymax, xmax] }],
    "image2": [{ "type": "tree|bush|pool", "box_2d": [ymin, xmin, ymax, xmax] }],
    "image3": [{ "type": "tree|bush|pool", "box_2d": [ymin, xmin, ymax, xmax] }]
  },
  "lawnSqft": <number>, "treeCount": <number>, "bushCount": <number>,
  "hasPool": <bool>, "hasFence": <bool>, "fenceLength": <number>,
  "pathwaySqft": <number>, "gardenBeds": <number>, "drivewayPresent": <bool>,
  "confidence": <0.0-1.0>,
  "notes": [<string>]
}

**IMPORTANT for locationsByImage:**
- image1 = Very Close Satellite (Zoom 21)
- image2 = Close Satellite (Zoom 20)
- image3 = Medium Satellite (Zoom 19)
- box_2d format: [ymin, xmin, ymax, xmax] on 0-1000 scale
- Same feature should appear in ALL 3 images at correctly scaled positions`;

  // Build Gemini Parts (Interleaved text labels + images)
  const geminiParts: GeminiPart[] = [{ text: analysisPrompt }];
  allImages.forEach((img, i) => {
    geminiParts.push({ text: `\n\n--- IMAGE ${i + 1}: ${img.label} ---\n` });
    geminiParts.push({ inline_data: { mime_type: img.mime, data: img.data } });
  });

  console.log(`[Consensus] Starting AI Analysis on ${allImages.length} images...`);

  const results = await Promise.allSettled([
    callGemini(apiKey, geminiParts),
    callOpenAI(analysisPrompt, allImages)
  ]);

  const successes = results
    .filter((r): r is PromiseFulfilledResult<PropertyAnalysis> => r.status === 'fulfilled')
    .map(r => r.value);

  if (successes.length === 0) {
    const errors = results.map(r => r.status === 'rejected' ? r.reason : '').join("; ");
    if (errors.includes("Rate Limited")) throw new Error("Rate Limited");
    throw new Error(`Consensus Failed: ${errors}`);
  }

  let finalAnalysis: PropertyAnalysis;
  let providerUsed = "";

  if (successes.length === 2) {
    const [r1, r2] = successes;
    // Consensus Merge
    finalAnalysis = {
      lawnSqft: Math.round((r1.lawnSqft + r2.lawnSqft) / 2),
      treeCount: Math.round((r1.treeCount + r2.treeCount) / 2),
      bushCount: Math.round((r1.bushCount + r2.bushCount) / 2),
      hasPool: r1.hasPool || r2.hasPool,
      hasFence: r1.hasFence || r2.hasFence,
      fenceLength: Math.max(r1.fenceLength, r2.fenceLength),
      pathwaySqft: Math.round((r1.pathwaySqft + r2.pathwaySqft) / 2),
      gardenBeds: Math.round((r1.gardenBeds + r2.gardenBeds) / 2),
      drivewayPresent: r1.drivewayPresent || r2.drivewayPresent,
      confidence: Math.min(0.98, ((r1.confidence + r2.confidence) / 2) + 0.1),
      notes: [...r1.notes, ...r2.notes, `Verified by Consensus (${Date.now() - startTime}ms)`],
      locations: [...(r1.locations || []), ...(r2.locations || [])]
    };
    providerUsed = "Consensus (Gemini/OpenAI)";
  } else {
    finalAnalysis = successes[0];
    providerUsed = results[0].status === 'fulfilled' ? "Gemini 3" : "GPT-4o (Fallback)";
    finalAnalysis.notes.push(`Single Source: ${providerUsed}`);
  }

  // ========== STEP 3: ATTACH PRE-COMPUTED SAM MASKS ==========
  // SAM was run first (Step 1), now attach results to the analysis
  if (samMasksByImage && Object.keys(samMasksByImage).length > 0) {
    finalAnalysis.samMasksByImage = samMasksByImage;
    let totalMasks = 0;
    // Sum up masks for all potential images (1-6)
    Object.values(samMasksByImage).forEach(masks => {
        if (masks) totalMasks += masks.length;
    });
    
    finalAnalysis.notes.push(`[SAM] Pre-detected ${totalMasks} masks across ${Object.keys(samMasksByImage).length} images`);
    console.log(`[Consensus] STEP 3: Attached ${totalMasks} SAM masks to analysis`);
  }

  // Apply boundary enforcement to filter features outside property
  try {
    const boundaryAgent = getBoundaryAgent();
    const parcelPolygon = config.parcelData?.polygon as import('./site-manager/boundary-agent').ParcelPolygon | undefined;
    
    finalAnalysis = boundaryAgent.enforcePropertyBoundary(finalAnalysis, {
      parcelPolygon,
      centerLat: config.lat,
      centerLng: config.lng,
      zoom: 21, // Default to highest zoom (image1)
    });
    
    const stats = boundaryAgent.getStats();
    console.log(`[Consensus] Boundary enforcement: kept ${stats.featuresInBoundary}/${stats.totalFeatures} features`);
  } catch (boundaryError) {
    console.error('[Consensus] Boundary error (non-fatal):', boundaryError);
    finalAnalysis.notes.push('[Boundary] Enforcement skipped - error');
  }

  return { provider: providerUsed, analysis: finalAnalysis };
};
