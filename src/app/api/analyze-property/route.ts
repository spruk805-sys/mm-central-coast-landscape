import { NextRequest, NextResponse } from "next/server";
import { runConsensusAnalysis } from "@/services/ai-consensus";



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
    
    // Parcel boundary path for drawing on satellite images (red polygon)
    let boundaryPath = "";

    if (regridKey) {
      try {
        console.log("[AI Analysis] Fetching parcel boundary from Regrid...");
        const regridUrl = `https://app.regrid.com/api/v2/parcels/point?lat=${lat}&lon=${lng}&token=${regridKey}&return_geometry=true`;
        
        const regridResponse = await fetch(regridUrl, {
          headers: { "Accept": "application/json" },
        });

        if (regridResponse.ok) {
          const regridData = await regridResponse.json();
          console.log("[AI Analysis] Regrid response:", JSON.stringify(regridData).substring(0, 300));
          if (regridData.parcels?.features?.length > 0) {
            const feature = regridData.parcels.features[0];
            const props = feature.properties?.fields || feature.properties || {};
            const geometry = feature.geometry;
            
            console.log("[AI Analysis] Geometry type:", geometry?.type, "Has coords:", !!geometry?.coordinates);

            // Calculate bounds
            const bounds = { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 };
            
            // Extract polygon ring for boundary drawing
            let polygonRing: number[][] = [];
            
            if (geometry?.coordinates) {
              // Get the outer ring of the polygon
              if (geometry.type === "MultiPolygon") {
                polygonRing = geometry.coordinates[0][0]; // First polygon, outer ring
              } else if (geometry.type === "Polygon") {
                polygonRing = geometry.coordinates[0]; // Outer ring
              }
              console.log("[AI Analysis] Polygon ring extracted:", polygonRing.length, "points");
              
              // Calculate bounds from all coords
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
              
              // Build boundary path for Google Static Maps API
              // Format: path=color:0xRRGGBBAA|weight:W|lat,lng|lat,lng|...
              if (polygonRing.length > 0) {
                // Sample points if too many (Static Maps has URL length limits)
                const maxPoints = 50;
                const step = Math.max(1, Math.floor(polygonRing.length / maxPoints));
                const sampledPoints = polygonRing.filter((_, i) => i % step === 0);
                
                // Close the polygon by adding first point at end
                const pathPoints = sampledPoints.map((c: number[]) => `${c[1].toFixed(6)},${c[0].toFixed(6)}`);
                if (pathPoints.length > 0 && pathPoints[pathPoints.length - 1] !== pathPoints[0]) {
                  pathPoints.push(pathPoints[0]);
                }
                
                // Red outline, no fill (so AI can see features inside)
                boundaryPath = `&path=color:0xFF0000FF|weight:3|${pathPoints.join("|")}`;
                console.log("[AI Analysis] Boundary path created with", pathPoints.length, "points");
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
              hasBoundaryPath: boundaryPath.length > 0,
            });
          }
        }
      } catch (err) {
        console.error("[AI Analysis] Regrid fetch error:", err);
      }
    }
    
    // Fallback: Create estimated boundary if Regrid didn't provide geometry
    // This ensures AI always sees a boundary reference
    if (!boundaryPath) {
      console.log("[AI Analysis] Creating estimated boundary (Regrid had no geometry)");
      // Estimate: typical residential lot ~100ft x 100ft = ~0.0003 degrees
      const offset = 0.00015; // ~50ft from center
      const corners = [
        [lat + offset, lng - offset], // NW
        [lat + offset, lng + offset], // NE
        [lat - offset, lng + offset], // SE
        [lat - offset, lng - offset], // SW
        [lat + offset, lng - offset], // Close polygon
      ];
      const pathPoints = corners.map(c => `${c[0].toFixed(6)},${c[1].toFixed(6)}`);
      boundaryPath = `&path=color:0xFFAA00FF|weight:2|${pathPoints.join("|")}`; // Orange for estimated
      console.log("[AI Analysis] Estimated boundary created");
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
    // boundaryPath adds a red polygon outline showing the exact parcel boundary
    const satelliteCloseUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=21&size=${size}&maptype=${mapType}&key=${mapsApiKey}${boundaryPath}`;
    const satelliteMediumUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=${size}&maptype=${mapType}&key=${mapsApiKey}${boundaryPath}`;
    const satelliteWideUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=${size}&maptype=${mapType}&key=${mapsApiKey}${boundaryPath}`;

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
    
    // Prepare images with labels for the Consensus Service
    const satelliteImages = [
      { mime: "image/png", data: base64SatelliteClose, label: "Satellite View (Zoom 21) - Very Close, use for Lawn/Pool" },
      { mime: "image/png", data: base64SatelliteMedium, label: "Satellite View (Zoom 20) - Medium, use for Property Layout" },
      { mime: "image/png", data: base64SatelliteWide, label: "Satellite View (Zoom 19) - Wide, use for Boundaries" },
    ];
    
    // Process Street View
    const streetIds = streetViewImages.map((data, i) => ({
      mime: "image/jpeg", 
      data, 
      label: `Street View Angle #${i+1} (Ground Level) - Check Frontend/Fences`
    }));

    // Process User Photos
    const processedUserPhotos: { mime: string, data: string, label: string }[] = [];
    for (const photo of userPhotos) {
        try {
            const buffer = await photo.arrayBuffer();
            processedUserPhotos.push({
                mime: photo.type || "image/jpeg",
                data: Buffer.from(buffer).toString("base64"),
                label: `User Photo (Customer Uploaded) - HIGH TRUST`
            });
        } catch (e) {
            console.error("Failed to process user photo", e);
        }
    }

    // Call Consensus Service
    console.log(`[API] calling runConsensusAnalysis with ${satelliteImages.length + streetIds.length + processedUserPhotos.length} images`);
    
    let aiResult;
    try {
        aiResult = await runConsensusAnalysis({
            address: address,
            lat: lat,
            lng: lng,
            parcelData: parcelData,
            satelliteImages: satelliteImages,
            streetViewImages: streetIds,
            userPhotos: processedUserPhotos
        });
    } catch (error) {
        console.error("[API] Consensus Analysis failed:", error);
         if (error instanceof Error && error.message.includes("Rate Limited")) {
            return NextResponse.json(
                { error: "AI service busy. Please try again in 30s." }, 
                { status: 429 }
            );
         }
         throw error;
    }

    return NextResponse.json({
      success: true,
      provider: aiResult.provider,
      analysis: aiResult.analysis,
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
