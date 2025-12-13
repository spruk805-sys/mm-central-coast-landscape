import { NextRequest, NextResponse } from "next/server";

interface AerialViewVideo {
  mediaType: string;
  uri: string;
}

interface AerialViewMetadata {
  videoId: string;
  state: string;
  videos?: AerialViewVideo[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("[Aerial View] Missing Google Maps API key");
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    console.log("[Aerial View] Looking up video for:", address);

    // First, look up if a video exists for this address
    const lookupUrl = `https://aerialview.googleapis.com/v1/videos:lookupVideo?key=${apiKey}&address=${encodeURIComponent(address)}`;

    const lookupResponse = await fetch(lookupUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!lookupResponse.ok) {
      const errorText = await lookupResponse.text();
      console.log("[Aerial View] Lookup response:", lookupResponse.status, errorText);
      
      // 404 means no video available for this address
      if (lookupResponse.status === 404) {
        return NextResponse.json({
          success: true,
          available: false,
          message: "No aerial video available for this address",
        });
      }
      
      return NextResponse.json(
        { error: "Failed to lookup aerial video" },
        { status: lookupResponse.status }
      );
    }

    const metadata: AerialViewMetadata = await lookupResponse.json();
    
    console.log("[Aerial View] Video found:", {
      videoId: metadata.videoId,
      state: metadata.state,
      videoCount: metadata.videos?.length || 0,
    });

    // Check if video is ready
    if (metadata.state !== "ACTIVE") {
      return NextResponse.json({
        success: true,
        available: false,
        state: metadata.state,
        message: "Aerial video is still processing",
      });
    }

    // Return available videos
    const videos = metadata.videos?.map(v => ({
      type: v.mediaType,
      url: v.uri,
    })) || [];

    return NextResponse.json({
      success: true,
      available: true,
      videoId: metadata.videoId,
      videos,
    });

  } catch (error) {
    console.error("[Aerial View] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch aerial video" },
      { status: 500 }
    );
  }
}
