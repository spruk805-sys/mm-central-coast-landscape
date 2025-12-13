import { NextRequest, NextResponse } from "next/server";

interface DumpAnalysis {
  items: {
    name: string;
    quantity: number;
    estimatedWeight: string;
    estimatedSize: string;
    disposalType: 'dump' | 'donate' | 'recycle';
  }[];
  totalEstimatedWeight: string;
  totalVolume: string;
  vehicleRequired: string;
  crewSize: number;
  equipmentNeeded: string[];
  estimatedTime: string;
  estimatedCost: {
    low: number;
    high: number;
  };
  notes: string[];
  confidence: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const images = formData.getAll("images") as File[];
    const description = formData.get("description") as string || "";

    console.log("[Dump Analysis] Starting analysis with", images.length, "images");

    if (images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;

    if (!apiKey) {
      console.error("[Dump Analysis] Missing GOOGLE_AI_STUDIO_KEY");
      return NextResponse.json(
        { error: "AI Studio API key not configured" },
        { status: 500 }
      );
    }

    // Convert images to base64
    const imageDataArray = await Promise.all(
      images.slice(0, 5).map(async (file) => {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        return {
          inline_data: {
            mime_type: file.type || "image/jpeg",
            data: base64,
          },
        };
      })
    );

    console.log("[Dump Analysis] Processed", imageDataArray.length, "images");

    const analysisPrompt = `You are an expert junk removal and hauling specialist. Analyze these ${images.length} image(s) of items that a customer wants to haul away or dump.

Customer notes: ${description || "No additional notes provided"}

Please analyze the images and provide detailed estimates for:

1. **Items Identified**: List each distinct item/pile you can see with:
   - Name/description
   - Estimated quantity
   - Estimated weight (in lbs)
   - Estimated size/dimensions
   - Disposal type: "dump" (landfill), "donate" (Salvation Army/charity), or "recycle"

2. **Total Estimated Weight**: Combined weight of all items

3. **Total Volume**: Estimate in cubic yards or truck load percentage

4. **Vehicle Required**: What type of vehicle is needed?
   - "Pickup Truck" - small loads under 1 cubic yard
   - "Pickup with Trailer" - medium loads 1-3 cubic yards
   - "Dump Trailer" - larger loads 3-6 cubic yards
   - "Box Truck" - furniture/household items
   - "Roll-off Dumpster" - major cleanouts

5. **Crew Size**: How many people needed to safely load these items? (1-4)

6. **Equipment Needed**: List any special equipment:
   - Dolly/hand truck
   - Furniture straps
   - Gloves and PPE
   - Wheelbarrow
   - Chainsaw (for large yard debris)

7. **Estimated Time**: How long to load everything?

8. **Notes**: Any special considerations (heavy items, hazardous materials, access issues, donation potential)

9. **Confidence**: Your confidence in this estimate (0.0 to 1.0)

Respond in this exact JSON format ONLY (no markdown, no explanation):
{
  "items": [
    {"name": "string", "quantity": number, "estimatedWeight": "string", "estimatedSize": "string", "disposalType": "dump|donate|recycle"}
  ],
  "totalEstimatedWeight": "string in lbs",
  "totalVolume": "string (e.g., '1/4 truck load' or '2 cubic yards')",
  "vehicleRequired": "string",
  "crewSize": number,
  "equipmentNeeded": ["array of strings"],
  "estimatedTime": "string (e.g., '45 minutes')",
  "estimatedCost": {"low": number, "high": number},
  "notes": ["array of observation strings"],
  "confidence": number
}`;

    // Build request for Gemini
    const geminiRequest = {
      contents: [
        {
          parts: [
            { text: analysisPrompt },
            ...imageDataArray,
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
      },
    };

    console.log("[Dump Analysis] Calling Gemini API...");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiRequest),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("[Dump Analysis] Gemini API error:", geminiResponse.status, errorText);
      
      if (geminiResponse.status === 429) {
        return NextResponse.json(
          { error: "AI service is temporarily busy. Please try again in a minute." },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: "AI analysis failed. Please try again." },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      console.error("[Dump Analysis] No response from Gemini");
      return NextResponse.json(
        { error: "AI could not analyze the images" },
        { status: 500 }
      );
    }

    console.log("[Dump Analysis] Got response, parsing...");

    // Parse the JSON response
    let analysis: DumpAnalysis;
    try {
      const cleanedResponse = textResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      analysis = JSON.parse(cleanedResponse);
    } catch {
      console.error("[Dump Analysis] Failed to parse response:", textResponse);
      // Return default analysis
      analysis = {
        items: [{ name: "Various items", quantity: 1, estimatedWeight: "Unknown", estimatedSize: "Unknown", disposalType: "dump" }],
        totalEstimatedWeight: "Estimate unavailable",
        totalVolume: "Estimate unavailable",
        vehicleRequired: "Pickup Truck",
        crewSize: 2,
        equipmentNeeded: ["Gloves", "Dolly"],
        estimatedTime: "1-2 hours",
        estimatedCost: { low: 150, high: 300 },
        notes: ["Could not fully analyze images - manual review recommended"],
        confidence: 0.3,
      };
    }

    // Ensure cost estimates are reasonable
    if (!analysis.estimatedCost || typeof analysis.estimatedCost.low !== 'number') {
      // Calculate based on crew and time
      const baseRate = 75; // per hour
      const crewMultiplier = analysis.crewSize || 2;
      const hours = parseFloat(analysis.estimatedTime) || 1.5;
      analysis.estimatedCost = {
        low: Math.round(baseRate * crewMultiplier * hours * 0.8),
        high: Math.round(baseRate * crewMultiplier * hours * 1.3),
      };
    }

    console.log("[Dump Analysis] Analysis complete:", analysis.items.length, "items identified");

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error) {
    console.error("[Dump Analysis] Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze images" },
      { status: 500 }
    );
  }
}
