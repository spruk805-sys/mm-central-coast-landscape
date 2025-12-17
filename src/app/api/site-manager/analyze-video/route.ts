import { NextResponse } from 'next/server';
import { getSiteManager } from '@/services/site-manager';

export async function POST(request: Request) {
  try {
    const { videoUrl, service } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    if (!service || (service !== 'landscaping' && service !== 'dump')) {
        return NextResponse.json(
            { error: 'Valid service type (landscaping or dump) is required' },
            { status: 400 }
        );
    }

    const siteManager = getSiteManager();
    const result = await siteManager.analyzeVideo(videoUrl, service);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing video:', error);
    return NextResponse.json(
      { error: 'Failed to analyze video' },
      { status: 500 }
    );
  }
}
