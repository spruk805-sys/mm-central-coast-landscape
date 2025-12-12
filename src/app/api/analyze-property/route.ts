import { NextRequest, NextResponse } from "next/server";

interface PropertyAnalysis {
  lawnSqft: number;
  treeCount: number;
  bushCount: number;
  hasPool: boolean;
  hasFence: boolean;
  gardenBeds: number;
  drivewayPresent: boolean;
  confidence: number;
  notes: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, address } = await request.json();
    console.log("[AI Analysis] Starting analysis for:", { lat, lng, address });

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log("[AI Analysis] API keys configured:", { 
      hasGeminiKey: !!apiKey, 
      hasMapsKey: !!mapsApiKey,
      geminiKeyPrefix: apiKey?.substring(0, 10) + "..."
    });

    if (!apiKey) {
      console.error("[AI Analysis] Missing GOOGLE_AI_STUDIO_KEY");
      return NextResponse.json(
        { error: "AI Studio API key not configured. Please add GOOGLE_AI_STUDIO_KEY to .env.local" },
        { status: 500 }
      );
    }

    // Fetch multiple satellite images at different zoom levels for comprehensive view
    const size = "640x640";
    const mapType = "satellite";
    
    // Multiple zoom levels: close-up (20), medium (19), wide (18)
    const satelliteCloseUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=${size}&maptype=${mapType}&key=${mapsApiKey}`;
    const satelliteMediumUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=${size}&maptype=${mapType}&key=${mapsApiKey}`;
    const satelliteWideUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=${size}&maptype=${mapType}&key=${mapsApiKey}`;

    // Multiple Street View angles (front, left, right)
    const streetViewFrontUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${lat},${lng}&fov=100&pitch=10&key=${mapsApiKey}`;
    const streetViewLeftUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${lat},${lng}&fov=100&heading=270&pitch=10&key=${mapsApiKey}`;
    const streetViewRightUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${lat},${lng}&fov=100&heading=90&pitch=10&key=${mapsApiKey}`;

    console.log("[AI Analysis] Fetching multiple satellite and street view images...");
    
    // Fetch all images in parallel
    const [
      satelliteCloseRes, 
      satelliteMediumRes, 
      satelliteWideRes,
      streetViewFrontRes,
      streetViewLeftRes,
      streetViewRightRes
    ] = await Promise.all([
      fetch(satelliteCloseUrl),
      fetch(satelliteMediumUrl),
      fetch(satelliteWideUrl),
      fetch(streetViewFrontUrl),
      fetch(streetViewLeftUrl),
      fetch(streetViewRightUrl)
    ]);

    if (!satelliteCloseRes.ok) {
      console.error("[AI Analysis] Failed to fetch satellite image:", satelliteCloseRes.statusText);
      return NextResponse.json(
        { error: "Failed to fetch satellite image" },
        { status: 500 }
      );
    }

    // Convert all satellite images to base64
    const satelliteCloseBuffer = await satelliteCloseRes.arrayBuffer();
    const base64SatelliteClose = Buffer.from(satelliteCloseBuffer).toString("base64");
    
    const satelliteMediumBuffer = await satelliteMediumRes.arrayBuffer();
    const base64SatelliteMedium = Buffer.from(satelliteMediumBuffer).toString("base64");
    
    const satelliteWideBuffer = await satelliteWideRes.arrayBuffer();
    const base64SatelliteWide = Buffer.from(satelliteWideBuffer).toString("base64");
    
    // Street view images (may not be available for all locations)
    const streetViewImages: string[] = [];
    
    if (streetViewFrontRes.ok) {
      const buffer = await streetViewFrontRes.arrayBuffer();
      streetViewImages.push(Buffer.from(buffer).toString("base64"));
    }
    if (streetViewLeftRes.ok) {
      const buffer = await streetViewLeftRes.arrayBuffer();
      streetViewImages.push(Buffer.from(buffer).toString("base64"));
    }
    if (streetViewRightRes.ok) {
      const buffer = await streetViewRightRes.arrayBuffer();
      streetViewImages.push(Buffer.from(buffer).toString("base64"));
    }
    
    console.log(`[AI Analysis] Fetched 3 satellite images and ${streetViewImages.length} street view images`);

    // Prepare prompt for Gemini Vision with multiple perspectives
    const imageCount = 3 + streetViewImages.length;
    const analysisPrompt = `You are an expert landscaping property analyst. Analyze these ${imageCount} images of a residential property and provide detailed estimates for landscaping services.

Property Address: ${address || "Unknown"}

I'm providing:
- 3 SATELLITE VIEWS at different zoom levels (close-up, medium, wide) to see the property from above
${streetViewImages.length > 0 ? `- ${streetViewImages.length} STREET VIEW image(s) showing the property from ground level` : ""}

Please analyze ALL images and provide your best estimates for:

1. **Lawn Area**: Estimate the total square footage of grass/lawn areas visible. Consider the scale (close-up satellite view is approximately 100ft x 100ft, medium is ~200ft, wide is ~400ft).

2. **Tree Count**: Count all visible trees (both large and small) from satellite and street views.

3. **Bush/Shrub Count**: Count visible bushes, hedges, and shrubs.

4. **Pool**: Is there a swimming pool or hot tub visible? (yes/no)

5. **Fence**: Are there visible fence lines around the property? (yes/no)

6. **Garden Beds**: How many distinct garden/flower bed areas are visible?

7. **Driveway**: Is there a driveway visible? (yes/no)

8. **Confidence**: How confident are you in this analysis? (0.0 to 1.0)

9. **Notes**: Any additional observations about the property that might affect landscaping services (e.g., overgrown areas, dead plants, irrigation needs, condition of lawn from street view).

Respond in the following JSON format ONLY (no markdown, no explanation, just the JSON):
{
  "lawnSqft": <number>,
  "treeCount": <number>,
  "bushCount": <number>,
  "hasPool": <boolean>,
  "hasFence": <boolean>,
  "gardenBeds": <number>,
  "drivewayPresent": <boolean>,
  "confidence": <number between 0 and 1>,
  "notes": [<array of observation strings>]
}`;

    // Build the parts array with all images
    const imageParts: Array<{ inline_data: { mime_type: string; data: string } } | { text: string }> = [
      { text: analysisPrompt },
      // Close-up satellite view
      { inline_data: { mime_type: "image/png", data: base64SatelliteClose } },
      // Medium satellite view
      { inline_data: { mime_type: "image/png", data: base64SatelliteMedium } },
      // Wide satellite view
      { inline_data: { mime_type: "image/png", data: base64SatelliteWide } },
    ];

    // Add all street view images
    for (const svImage of streetViewImages) {
      imageParts.push({
        inline_data: { mime_type: "image/jpeg", data: svImage },
      });
    }

    console.log("[AI Analysis] Calling Gemini API...");

    // Call Gemini API with vision model
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: imageParts,
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("[AI Analysis] Gemini API error:", geminiResponse.status, errorText);
      return NextResponse.json(
        { error: `AI analysis failed (${geminiResponse.status})`, details: errorText },
        { status: 500 }
      );
    }

    console.log("[AI Analysis] Gemini response received");

    const geminiData = await geminiResponse.json();
    
    // Extract the text response
    const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      console.error("No response from Gemini:", geminiData);
      return NextResponse.json(
        { error: "No analysis returned from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let analysis: PropertyAnalysis;
    try {
      // Clean up the response (remove any markdown formatting)
      const cleanedResponse = textResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      analysis = JSON.parse(cleanedResponse);
    } catch {
      console.error("Failed to parse Gemini response:", textResponse);
      // Return a default analysis if parsing fails
      analysis = {
        lawnSqft: 2500,
        treeCount: 3,
        bushCount: 8,
        hasPool: false,
        hasFence: true,
        gardenBeds: 2,
        drivewayPresent: true,
        confidence: 0.5,
        notes: ["Unable to parse AI response, using estimated values"],
      };
    }

    // Validate and sanitize the response
    const sanitizedAnalysis: PropertyAnalysis = {
      lawnSqft: Math.max(0, Math.round(analysis.lawnSqft || 0)),
      treeCount: Math.max(0, Math.round(analysis.treeCount || 0)),
      bushCount: Math.max(0, Math.round(analysis.bushCount || 0)),
      hasPool: Boolean(analysis.hasPool),
      hasFence: Boolean(analysis.hasFence),
      gardenBeds: Math.max(0, Math.round(analysis.gardenBeds || 0)),
      drivewayPresent: Boolean(analysis.drivewayPresent),
      confidence: Math.min(1, Math.max(0, analysis.confidence || 0.7)),
      notes: Array.isArray(analysis.notes) ? analysis.notes : [],
    };

    return NextResponse.json({
      success: true,
      analysis: sanitizedAnalysis,
      imageUrl: satelliteCloseUrl,
    });

  } catch (error) {
    console.error("Property analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze property", details: String(error) },
      { status: 500 }
    );
  }
}
