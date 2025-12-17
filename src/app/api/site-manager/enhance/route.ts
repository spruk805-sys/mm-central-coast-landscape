import { NextRequest, NextResponse } from 'next/server';
import { getSiteManager } from '@/services/site-manager';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const siteManager = getSiteManager();
    const enhancedUrl = await siteManager.enhanceImage(imageUrl);

    return NextResponse.json({
      success: true,
      url: enhancedUrl,
    });
  } catch (error: any) {
    console.error('[Enhance API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enhance image' },
      { status: 500 }
    );
  }
}
