/**
 * SAM Segmentation API
 * Generates precise segmentation masks using SAM 3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSAMAgent, SegmentationResult } from '@/services/site-manager/sam-agent';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const promptsJson = formData.get('prompts') as string;
    const boxesJson = formData.get('boxes') as string;
    
    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }
    
    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = image.type || 'image/jpeg';
    
    const samAgent = getSAMAgent();
    let results: SegmentationResult[] = [];
    
    // Text prompts segmentation
    if (promptsJson) {
      try {
        const prompts = JSON.parse(promptsJson) as string[];
        const textResults = await samAgent.segmentWithText(base64, prompts, mimeType);
        results = [...results, ...textResults];
      } catch (e) {
        console.error('[SAM API] Failed to parse prompts:', e);
      }
    }
    
    // Box-based segmentation
    if (boxesJson) {
      try {
        const boxes = JSON.parse(boxesJson) as { type: string; x: number; y: number; w: number; h: number }[];
        const boxResults = await samAgent.segmentWithBoxes(base64, boxes, mimeType);
        results = [...results, ...boxResults];
      } catch (e) {
        console.error('[SAM API] Failed to parse boxes:', e);
      }
    }
    
    // If no prompts or boxes provided, use default landscape prompts
    if (!promptsJson && !boxesJson) {
      results = await samAgent.segmentLandscapeFeatures(base64);
    }
    
    return NextResponse.json({
      success: true,
      masks: results,
      count: results.length,
    });
    
  } catch (error) {
    console.error('[SAM API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Segmentation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const samAgent = getSAMAgent();
  const status = samAgent.getStatus();
  
  return NextResponse.json({
    success: true,
    enabled: status.details.hasApiKey,
    message: status.details.hasApiKey 
      ? 'SAM segmentation is enabled' 
      : 'Set ROBOFLOW_API_KEY to enable SAM segmentation',
    stats: status.details.stats,
  });
}
