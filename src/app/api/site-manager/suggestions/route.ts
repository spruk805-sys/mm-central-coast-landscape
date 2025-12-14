/**
 * Site Manager Suggestions API
 * Get and manage improvement suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSiteManager } from '@/services/site-manager';

// In a real implementation, this would be stored in the SiteManager
// For now, we expose what we can from the status

export async function GET() {
  try {
    const siteManager = getSiteManager();
    const status = siteManager.getStatus();

    // Generate suggestions based on current metrics
    const suggestions = [];
    
    // Performance suggestion
    if (status.metrics.averageLatencyMs > 15000) {
      suggestions.push({
        id: 'perf_1',
        category: 'performance',
        priority: 'high',
        title: 'High average latency',
        description: `Average response time is ${(status.metrics.averageLatencyMs / 1000).toFixed(1)}s`,
        status: 'pending',
      });
    }
    
    // Rate limit suggestion
    if (status.metrics.rateLimitHits > 0) {
      suggestions.push({
        id: 'rate_1',
        category: 'reliability',
        priority: 'critical',
        title: 'Rate limiting detected',
        description: `${status.metrics.rateLimitHits} rate limit hits recorded`,
        status: 'pending',
      });
    }
    
    // Error rate suggestion
    const errorRate = status.metrics.failedRequests / (status.metrics.totalRequests || 1);
    if (errorRate > 0.1) {
      suggestions.push({
        id: 'error_1',
        category: 'reliability',
        priority: 'high',
        title: 'High error rate',
        description: `${(errorRate * 100).toFixed(1)}% of requests failing`,
        status: 'pending',
      });
    }

    return NextResponse.json({
      success: true,
      suggestions,
      metrics: {
        totalRequests: status.metrics.totalRequests,
        errorRate: (errorRate * 100).toFixed(1) + '%',
        avgLatency: (status.metrics.averageLatencyMs / 1000).toFixed(1) + 's',
      },
    });
  } catch (error) {
    console.error('[Suggestions API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, suggestionId } = body;

    if (!action || !suggestionId) {
      return NextResponse.json(
        { success: false, error: 'Missing action or suggestionId' },
        { status: 400 }
      );
    }

    // In a full implementation, this would update the SuggestionAgent
    console.log(`[Suggestions API] ${action} suggestion ${suggestionId}`);

    return NextResponse.json({
      success: true,
      message: `Suggestion ${suggestionId} ${action}`,
    });
  } catch (error) {
    console.error('[Suggestions API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process suggestion' },
      { status: 500 }
    );
  }
}
