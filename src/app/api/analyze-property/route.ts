import { NextRequest, NextResponse } from "next/server";

interface PropertyAnalysis {
  lawnSqft: number;
  treeCount: number;
  bushCount: number;
  hasPool: boolean;
  hasFence: boolean;
  fenceLength: number;
  pathwaySqft: number;
  gardenBeds: number;
  drivewayPresent: boolean;
  confidence: number;
  notes: string[];
}

export async function POST(request: NextRequest) {
  try {
    let lat: number, lng: number, address: string;
    let userPhotos: File[] = [];
    
    // Check if request is FormData (has user photos) or JSON
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      lat = parseFloat(formData.get("lat") as string);
      lng = parseFloat(formData.get("lng") as string);
      address = formData.get("address") as string || "";
      userPhotos = formData.getAll("photos") as File[];
      console.log("[AI Analysis] FormData request with", userPhotos.length, "user photos");
    } else {
      const json = await request.json();
      lat = json.lat;
      lng = json.lng;
      address = json.address;
      console.log("[AI Analysis] JSON request");
    }
    
    console.log("[AI Analysis] Starting analysis for:", { lat, lng, address, userPhotoCount: userPhotos.length });

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const regridKey = process.env.REGRID_API_KEY;

    console.log("[AI Analysis] API keys configured:", { 
      hasGeminiKey: !!apiKey, 
      hasMapsKey: !!mapsApiKey,
      hasRegridKey: !!regridKey,
      geminiKeyPrefix: apiKey?.substring(0, 10) + "..."
    });

    if (!apiKey) {
      console.error("[AI Analysis] Missing GOOGLE_AI_STUDIO_KEY");
      return NextResponse.json(
        { error: "AI Studio API key not configured. Please add GOOGLE_AI_STUDIO_KEY to .env.local" },
        { status: 500 }
      );
    }

    // Fetch parcel boundary data from Regrid if available
    let parcelData: {
      sqft: number;
      acres: number;
      apn: string;
      dimensions: { latFeet: number; lngFeet: number; perimeterFeet: number };
    } | null = null;

    if (regridKey) {
      try {
        console.log("[AI Analysis] Fetching parcel boundary from Regrid...");
        const regridUrl = `https://app.regrid.com/api/v2/parcels/point?lat=${lat}&lon=${lng}&token=${regridKey}&return_geometry=true`;
        
        const regridResponse = await fetch(regridUrl, {
          headers: { "Accept": "application/json" },
        });

        if (regridResponse.ok) {
          const regridData = await regridResponse.json();
          if (regridData.parcels?.features?.length > 0) {
            const feature = regridData.parcels.features[0];
            const props = feature.properties?.fields || feature.properties || {};
            const geometry = feature.geometry;

            // Calculate bounds
            let bounds = { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 };
            if (geometry?.coordinates) {
              const coords = geometry.type === "MultiPolygon" 
                ? geometry.coordinates.flat(2)
                : geometry.coordinates.flat(1);
              for (const coord of coords) {
                if (Array.isArray(coord) && coord.length >= 2) {
                  bounds.minLng = Math.min(bounds.minLng, coord[0]);
                  bounds.maxLng = Math.max(bounds.maxLng, coord[0]);
                  bounds.minLat = Math.min(bounds.minLat, coord[1]);
                  bounds.maxLat = Math.max(bounds.maxLat, coord[1]);
                }
              }
            }

            // Calculate dimensions in feet
            const latDiff = bounds.maxLat - bounds.minLat;
            const lngDiff = bounds.maxLng - bounds.minLng;
            const avgLat = (bounds.maxLat + bounds.minLat) / 2;
            const latFeet = Math.round(latDiff * 364173);
            const lngFeet = Math.round(lngDiff * 364173 * Math.cos(avgLat * Math.PI / 180));

            parcelData = {
              sqft: parseFloat(props.ll_gissqft || props.sqft || "0") || 0,
              acres: parseFloat(props.ll_gisacre || props.acres || "0") || 0,
              apn: props.parcelnumb || props.apn || "",
              dimensions: {
                latFeet,
                lngFeet,
                perimeterFeet: (latFeet + lngFeet) * 2,
              },
            };

            console.log("[AI Analysis] Parcel found:", {
              apn: parcelData.apn,
              sqft: parcelData.sqft,
              dimensions: `${latFeet}ft x ${lngFeet}ft`,
            });
          }
        }
      } catch (err) {
        console.error("[AI Analysis] Regrid fetch error:", err);
      }
    }

    // Fetch Google Aerial View 3D video if available (US addresses only)
    let aerialViewVideo: { url: string; type: string } | null = null;
    if (address) {
      try {
        console.log("[AI Analysis] Checking for Aerial View video...");
        const aerialUrl = `https://aerialview.googleapis.com/v1/videos:lookupVideo?key=${mapsApiKey}&address=${encodeURIComponent(address)}`;
        
        const aerialResponse = await fetch(aerialUrl, {
          headers: { "Accept": "application/json" },
        });

        if (aerialResponse.ok) {
          const aerialData = await aerialResponse.json();
          if (aerialData.state === "ACTIVE" && aerialData.videos?.length > 0) {
            // Get the first available video (usually MP4)
            aerialViewVideo = {
              url: aerialData.videos[0].uri,
              type: aerialData.videos[0].mediaType || "video/mp4",
            };
            console.log("[AI Analysis] Aerial View video found:", aerialViewVideo.type);
          }
        }
      } catch (err) {
        console.log("[AI Analysis] Aerial View not available:", err);
      }
    }

    // Fetch multiple satellite images at different zoom levels for comprehensive view
    // Higher zoom = tighter focus on property to reduce neighbor inclusion
    const size = "640x640";
    const mapType = "satellite";
    
    // Multiple zoom levels: very close (21), close (20), medium (19) - all centered on property
    // Zoom 21 = ~40ft coverage, Zoom 20 = ~80ft, Zoom 19 = ~160ft
    const satelliteCloseUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=21&size=${size}&maptype=${mapType}&key=${mapsApiKey}`;
    const satelliteMediumUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=${size}&maptype=${mapType}&key=${mapsApiKey}`;
    const satelliteWideUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=${size}&maptype=${mapType}&key=${mapsApiKey}`;

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
    const imageCount = 3 + streetViewImages.length + userPhotos.length;
    
    // Build parcel info section for prompt
    const parcelInfo = parcelData 
      ? `
**VERIFIED PARCEL BOUNDARY DATA (from Regrid.com):**
- Assessor Parcel Number (APN): ${parcelData.apn}
- Total Lot Size: ${parcelData.sqft.toLocaleString()} sq ft (${parcelData.acres.toFixed(2)} acres)
- Lot Dimensions: approximately ${parcelData.dimensions.latFeet}ft x ${parcelData.dimensions.lngFeet}ft
- Estimated Perimeter: ${parcelData.dimensions.perimeterFeet}ft

⚠️ USE THESE EXACT PARCEL DIMENSIONS when estimating lawn area and fence length. The lot is ${parcelData.sqft.toLocaleString()} sq ft TOTAL - lawn will be LESS than this (subtract house, driveway, patios).
`
      : `
**PARCEL BOUNDARY:** Exact boundary data unavailable. Use satellite image center as reference.
`;

    const analysisPrompt = `You are an expert landscaping property analyst. Analyze these ${imageCount} images of a SINGLE residential property and provide detailed estimates for landscaping services.

**CRITICAL - PROPERTY BOUNDARY INSTRUCTIONS:**
The property we are analyzing is located at: ${address || "Unknown"}
GPS Coordinates: ${lat}, ${lng}
${parcelInfo}
⚠️ IMPORTANT: The GPS coordinates mark the CENTER of the target property. 
- In the CLOSE-UP satellite view (zoom 21), the TARGET PROPERTY fills most of the image - analyze ONLY this property
- In the MEDIUM satellite view (zoom 20), the target property is in the CENTER - IGNORE surrounding properties
- In the WIDE satellite view (zoom 19), you can see multiple properties - ONLY analyze the ONE in the CENTER
- The Street View images show the target property from the street - focus on THIS property only

DO NOT include ANY features from neighboring properties. If you see fences, trees, or landscaping that clearly belong to adjacent lots, EXCLUDE them from your counts.

**IMAGES PROVIDED (analyze EACH image individually, then synthesize):**
You will receive ${imageCount} images in this order:
1. SATELLITE VIEW #1 (Zoom 21, ~40ft) - Very close aerial view, see fine details
2. SATELLITE VIEW #2 (Zoom 20, ~80ft) - Close aerial view, see property layout
3. SATELLITE VIEW #3 (Zoom 19, ~160ft) - Medium aerial view, see lot boundaries
${streetViewImages.length > 0 ? `4-${3 + streetViewImages.length}. STREET VIEW (${streetViewImages.length} angles) - Ground level views of front yard, landscaping, trees` : ""}
${userPhotos.length > 0 ? `${4 + streetViewImages.length}-${3 + streetViewImages.length + userPhotos.length}. USER PHOTOS (${userPhotos.length}) - Customer-provided images of their property` : ""}

**MULTI-IMAGE ANALYSIS PROCESS:**
1. Analyze EACH image separately - note what you see in each view
2. Cross-reference findings between satellite and street views
3. Use close satellite for lawn/pool/patio details
4. Use medium satellite for tree count and property layout
5. Use street view for front yard features, fence style, bush/shrub details
6. Synthesize all observations into final counts
7. If images disagree, trust the clearer/closer view

**ANALYSIS REQUIRED (for the TARGET PROPERTY ONLY):**

1. **Lawn Area**: Estimate square footage of grass/lawn on the TARGET property only. Typical residential lots are 5,000-15,000 sq ft total. Be conservative.

2. **Tree Count**: Count trees ON the target property. Look for trees WITHIN the property footprint, not along street or in neighbor's yards.

3. **Bush/Shrub Count**: Count bushes and hedges that are clearly ON the target property.

4. **Pool**: Is there a pool/hot tub on THIS property? (yes/no)

5. **Fence**: Does THIS property have fencing? Look for fence along property lines. (yes/no)

6. **Fence Length**: If fenced, estimate linear feet for THIS property only. Typical lot perimeter is 200-400 linear feet.

7. **Pathway Area**: Square footage of walkways on THIS property (front walk, side paths, back patio access).

8. **Garden Beds**: Count distinct garden/flower beds ON this property.

9. **Driveway**: Does THIS property have a driveway? (yes/no)

10. **Confidence**: How confident are you in focusing only on the correct property? (0.0 to 1.0)

11. **Notes**: Observations about THIS property. If boundary was unclear in any image, note it here.

Respond in JSON format ONLY:
{
  "lawnSqft": <number - be conservative, typical is 2000-6000>,
  "treeCount": <number - typically 0-10 for residential>,
  "bushCount": <number - typically 0-20>,
  "hasPool": <boolean>,
  "hasFence": <boolean>,
  "fenceLength": <number - 0 if no fence, typically 100-400 ft>,
  "pathwaySqft": <number - typically 50-300 sq ft>,
  "gardenBeds": <number - typically 0-5>,
  "drivewayPresent": <boolean>,
  "confidence": <number 0-1>,
  "notes": [<observations about THIS property>]
}`;

    // Open AI Fallback Function
    const callOpenAI = async (promptText: string, images: { mime: string, data: string }[]) => {
      const openAIKey = process.env.OPENAI_API_KEY;
      if (!openAIKey) throw new Error("OpenAI API key not configured for fallback.");

      console.log("[AI Analysis] Falling back to OpenAI GPT-4o...");
      
      const content = [
        { type: "text", text: promptText },
        ...images.map(img => ({
          type: "image_url",
          image_url: { url: `data:${img.mime};base64,${img.data}` }
        }))
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content }],
          max_tokens: 1024,
          temperature: 0.2,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API failed: ${response.status} ${err}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    };

    // Prepare images for both providers
    const processedImages: { mime: string, data: string }[] = [
      { mime: "image/png", data: base64SatelliteClose },
      { mime: "image/png", data: base64SatelliteMedium },
      { mime: "image/png", data: base64SatelliteWide },
      ...streetViewImages.map(data => ({ mime: "image/jpeg", data })),
    ];

    // Add user photos
    for (const photo of userPhotos) {
      try {
        const bytes = await photo.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        processedImages.push({
          mime: photo.type || "image/jpeg",
          data: base64
        });
      } catch (err) {
        console.error("[AI Analysis] Failed to process user photo:", err);
      }
    }

    console.log("[AI Analysis] Calling Gemini API (Primary)...");

    let textResponse: string | null = null;
    let providerUsed = "Gemini";

    try {
      // Build Gemini Parts
      const geminiParts = [
        { text: analysisPrompt },
        ...processedImages.map(img => ({
          inline_data: { mime_type: img.mime, data: img.data }
        }))
      ];

      // Call Gemini
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: geminiParts }],
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
        throw new Error(`Gemini status ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      
    } catch (geminiError) {
      console.error(`[AI Analysis] Gemini failed: ${geminiError}. Attempting fallback...`);
      
      try {
        textResponse = await callOpenAI(analysisPrompt, processedImages);
        providerUsed = "OpenAI GPT-4o";
      } catch (openAIError) {
        console.error(`[AI Analysis] OpenAI fallback failed: ${openAIError}`);
        // If both fail, throw the original error or a combined one
        throw new Error(`Both AI providers failed. Gemini: ${geminiError}, OpenAI: ${openAIError}`);
      }
    }

    if (!textResponse) {
       throw new Error("No analysis returned from any provider");
    }

    console.log(`[AI Analysis] Success! Provider: ${providerUsed}`);

    // Parse the JSON response
    let analysis: PropertyAnalysis;
    try {
      // Clean up the response (remove any markdown formatting)
      const cleanedResponse = textResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      analysis = JSON.parse(cleanedResponse);
      analysis.notes = [...(analysis.notes || []), `Analysis verified by ${providerUsed}`];
    } catch {
      console.error("Failed to parse AI response:", textResponse);
      // Return a default analysis if parsing fails
      analysis = {
        lawnSqft: 2500,
        treeCount: 3,
        bushCount: 8,
        hasPool: false,
        hasFence: true,
        fenceLength: 150,
        pathwaySqft: 200,
        gardenBeds: 2,
        drivewayPresent: true,
        confidence: 0.5,
        notes: ["Unable to parse AI response", `Provider: ${providerUsed}`],
      };
    }

    // Validate and sanitize the response
    const sanitizedAnalysis: PropertyAnalysis = {
      lawnSqft: Math.max(0, Math.round(analysis.lawnSqft || 0)),
      treeCount: Math.max(0, Math.round(analysis.treeCount || 0)),
      bushCount: Math.max(0, Math.round(analysis.bushCount || 0)),
      hasPool: Boolean(analysis.hasPool),
      hasFence: Boolean(analysis.hasFence),
      fenceLength: Math.max(0, Math.round(analysis.fenceLength || 0)),
      pathwaySqft: Math.max(0, Math.round(analysis.pathwaySqft || 0)),
      gardenBeds: Math.max(0, Math.round(analysis.gardenBeds || 0)),
      drivewayPresent: Boolean(analysis.drivewayPresent),
      confidence: Math.min(1, Math.max(0, analysis.confidence || 0.7)),
      notes: Array.isArray(analysis.notes) ? analysis.notes : [],
    };

    return NextResponse.json({
      success: true,
      provider: providerUsed,
      analysis: sanitizedAnalysis,
      imageUrl: satelliteCloseUrl,
      parcel: parcelData ? {
        apn: parcelData.apn,
        sqft: parcelData.sqft,
        acres: parcelData.acres,
        dimensions: parcelData.dimensions,
      } : null,
      aerialVideo: aerialViewVideo,
    });

  } catch (error) {
    console.error("Property analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze property", details: String(error) },
      { status: 500 }
    );
  }
}
