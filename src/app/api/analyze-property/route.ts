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

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI Studio API key not configured" },
        { status: 500 }
      );
    }

    // Fetch satellite image from Google Maps Static API
    const zoom = 20; // High zoom for property detail
    const size = "640x640";
    const mapType = "satellite";
    const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&maptype=${mapType}&key=${mapsApiKey}`;

    // Fetch the satellite image
    const imageResponse = await fetch(satelliteUrl);
    if (!imageResponse.ok) {
      console.error("Failed to fetch satellite image:", imageResponse.statusText);
      return NextResponse.json(
        { error: "Failed to fetch satellite image" },
        { status: 500 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Prepare prompt for Gemini Vision
    const analysisPrompt = `You are an expert landscaping property analyst. Analyze this satellite/aerial image of a residential property and provide detailed estimates.

Property Address: ${address || "Unknown"}

Please analyze the image and provide your best estimates for:

1. **Lawn Area**: Estimate the total square footage of grass/lawn areas visible. Consider the scale (this is approximately a 100ft x 100ft view area at this zoom level).

2. **Tree Count**: Count all visible trees (both large and small).

3. **Bush/Shrub Count**: Count visible bushes, hedges, and shrubs.

4. **Pool**: Is there a swimming pool or hot tub visible? (yes/no)

5. **Fence**: Are there visible fence lines around the property? (yes/no)

6. **Garden Beds**: How many distinct garden/flower bed areas are visible?

7. **Driveway**: Is there a driveway visible? (yes/no)

8. **Confidence**: How confident are you in this analysis? (0.0 to 1.0)

9. **Notes**: Any additional observations about the property that might affect landscaping services.

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

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: analysisPrompt },
                {
                  inline_data: {
                    mime_type: "image/png",
                    data: base64Image,
                  },
                },
              ],
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
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: "AI analysis failed", details: errorText },
        { status: 500 }
      );
    }

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
      imageUrl: satelliteUrl,
    });

  } catch (error) {
    console.error("Property analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze property", details: String(error) },
      { status: 500 }
    );
  }
}
