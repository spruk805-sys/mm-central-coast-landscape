import { NextRequest, NextResponse } from "next/server";

interface RegridParcel {
  ll_uuid: string;
  apn: string;
  address: string;
  owner: string;
  acres: number;
  sqft: number;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const regridKey = process.env.REGRID_API_KEY;

    if (!regridKey) {
      console.error("[Parcel API] Missing REGRID_API_KEY");
      return NextResponse.json(
        { error: "Regrid API key not configured" },
        { status: 500 }
      );
    }

    console.log("[Parcel API] Fetching parcel for:", { lat, lng });

    // Query Regrid API for parcel at this point
    const regridUrl = `https://app.regrid.com/api/v2/parcels/point?lat=${lat}&lon=${lng}&token=${regridKey}&return_geometry=true`;

    const response = await fetch(regridUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Parcel API] Regrid error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch parcel data" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check if we got results
    if (!data.parcels || !data.parcels.features || data.parcels.features.length === 0) {
      console.log("[Parcel API] No parcel found at location");
      return NextResponse.json({
        success: true,
        parcel: null,
        message: "No parcel found at this location",
      });
    }

    // Get the first (closest) parcel
    const feature = data.parcels.features[0];
    const properties = feature.properties?.fields || feature.properties || {};
    const geometry = feature.geometry;

    // Calculate bounds from geometry
    let bounds = { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 };
    
    if (geometry && geometry.coordinates) {
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

    // Calculate lot dimensions
    const latDiff = bounds.maxLat - bounds.minLat;
    const lngDiff = bounds.maxLng - bounds.minLng;
    const avgLat = (bounds.maxLat + bounds.minLat) / 2;
    
    // Convert to approximate feet (111,320 meters per degree latitude, adjusted for longitude)
    const latFeet = latDiff * 364173; // 111320 * 3.28084
    const lngFeet = lngDiff * 364173 * Math.cos(avgLat * Math.PI / 180);

    const parcel: RegridParcel = {
      ll_uuid: feature.properties?.ll_uuid || "",
      apn: properties.parcelnumb || properties.apn || "",
      address: properties.address || properties.mailadd || "",
      owner: properties.owner || "",
      acres: parseFloat(properties.ll_gisacre || properties.acres || "0") || 0,
      sqft: parseFloat(properties.ll_gissqft || properties.sqft || "0") || 0,
      geometry: geometry,
      bounds: bounds,
    };

    console.log("[Parcel API] Found parcel:", {
      apn: parcel.apn,
      address: parcel.address,
      acres: parcel.acres,
      sqft: parcel.sqft,
      dimensions: `~${Math.round(latFeet)}ft x ${Math.round(lngFeet)}ft`,
    });

    return NextResponse.json({
      success: true,
      parcel,
      dimensions: {
        latFeet: Math.round(latFeet),
        lngFeet: Math.round(lngFeet),
        perimeterFeet: Math.round((latFeet + lngFeet) * 2),
      },
    });

  } catch (error) {
    console.error("[Parcel API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch parcel data" },
      { status: 500 }
    );
  }
}
