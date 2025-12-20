/**
 * Monitor Agent
 * Tracks API health, latency, errors, and system metrics
 */

import { Agent, AIProvider, Event, EventHandler, Metrics, HealthStatus } from './types';

export class MonitorAgent implements Agent {
  name = 'Monitor';
  
  private metrics: Metrics;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private startTime: Date;
  private hourlyBuckets: { timestamp: Date; requests: number; errors: number; totalLatency: number }[] = [];
  
  constructor(private config: { alertWebhook?: string; logLevel: string }) {
    this.startTime = new Date();
    this.metrics = this.initMetrics();
  }
  
  private initMetrics(): Metrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatencyMs: 0,
      rateLimitHits: 0,
      lastHour: { requests: 0, errors: 0, avgLatency: 0 },
      byProvider: {
        gemini: { requests: 0, errors: 0, avgLatency: 0, totalTokens: 0, totalCost: 0 },
        openai: { requests: 0, errors: 0, avgLatency: 0, totalTokens: 0, totalCost: 0 },
        claude: { requests: 0, errors: 0, avgLatency: 0, totalTokens: 0, totalCost: 0 },
        local: { requests: 0, errors: 0, avgLatency: 0, totalTokens: 0, totalCost: 0 },
        consensus: { requests: 0, errors: 0, avgLatency: 0, totalTokens: 0, totalCost: 0 },
      },
      totalTokens: 0,
      totalCost: 0,
    };
  }
  
  async start(): Promise<void> {
    console.log('[Monitor] Starting health monitoring...');
    // Clean up old hourly buckets every minute
    setInterval(() => this.cleanupHourlyBuckets(), 60000);
  }
  
  async stop(): Promise<void> {
    console.log('[Monitor] Stopping...');
  }
  
  getStatus(): { healthy: boolean; details: Record<string, unknown> } {
    const errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.failedRequests / this.metrics.totalRequests 
      : 0;
    
    return {
      healthy: errorRate < 0.1,
      details: {
        uptime: Date.now() - this.startTime.getTime(),
        metrics: this.metrics,
      },
    };
  }
  
  // Record a completed request
  recordRequest(provider: AIProvider, latencyMs: number, success: boolean, tokens = 0, cost = 0, error?: string): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    // Update average latency (running average)
    this.metrics.averageLatencyMs = 
      (this.metrics.averageLatencyMs * (this.metrics.totalRequests - 1) + latencyMs) / this.metrics.totalRequests;
      
    // Update global cost/tokens
    this.metrics.totalTokens = (this.metrics.totalTokens || 0) + tokens;
    this.metrics.totalCost = (this.metrics.totalCost || 0) + cost;
    
    // Update provider-specific metrics
    const providerMetrics = this.metrics.byProvider[provider];
    providerMetrics.requests++;
    if (!success) {
      providerMetrics.errors++;
      providerMetrics.lastError = error;
      providerMetrics.lastErrorAt = new Date();
    }
    providerMetrics.avgLatency = 
      (providerMetrics.avgLatency * (providerMetrics.requests - 1) + latencyMs) / providerMetrics.requests;
      
    // Update provider cost/tokens
    providerMetrics.totalTokens = (providerMetrics.totalTokens || 0) + tokens;
    providerMetrics.totalCost = (providerMetrics.totalCost || 0) + cost;
    
    // Add to hourly bucket
    this.addToHourlyBucket(success ? 0 : 1, latencyMs);
    
    // Log
    if (this.config.logLevel === 'debug' || this.config.logLevel === 'info') {
      console.log(`[Monitor] ${provider} request: ${success ? '✓' : '✗'} ${latencyMs}ms`);
    }
    
    // Check for alerts
    this.checkAlerts(provider, success, error);
  }
  
  // Record rate limit hit
  recordRateLimit(provider: AIProvider): void {
    this.metrics.rateLimitHits++;
    console.warn(`[Monitor] ⚠️ Rate limit hit on ${provider} (total: ${this.metrics.rateLimitHits})`);
    
    this.emit({
      type: 'provider.rateLimit',
      timestamp: new Date(),
      data: { provider, totalHits: this.metrics.rateLimitHits },
    });
  }
  
  // Get provider health status
  getProviderHealth(provider: AIProvider): HealthStatus {
    const pm = this.metrics.byProvider[provider];
    if (pm.requests === 0) return 'healthy';
    
    const errorRate = pm.errors / pm.requests;
    if (errorRate > 0.5) return 'down';
    if (errorRate > 0.1) return 'degraded';
    return 'healthy';
  }
  
  // Get all metrics
  getMetrics(): Metrics {
    this.updateLastHourMetrics();
    return { ...this.metrics };
  }
  
  // Event handling
  on(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }
  
  private emit(event: Event): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (e) {
        console.error('[Monitor] Event handler error:', e);
      }
    }
  }
  
  private addToHourlyBucket(errors: number, latency: number): void {
    const now = new Date();
    const bucketKey = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    
    let bucket = this.hourlyBuckets.find(b => b.timestamp.getTime() === bucketKey.getTime());
    if (!bucket) {
      bucket = { timestamp: bucketKey, requests: 0, errors: 0, totalLatency: 0 };
      this.hourlyBuckets.push(bucket);
    }
    
    bucket.requests++;
    bucket.errors += errors;
    bucket.totalLatency += latency;
  }
  
  private updateLastHourMetrics(): void {
    const oneHourAgo = Date.now() - 3600000;
    const recentBuckets = this.hourlyBuckets.filter(b => b.timestamp.getTime() > oneHourAgo);
    
    const totals = recentBuckets.reduce(
      (acc, b) => ({
        requests: acc.requests + b.requests,
        errors: acc.errors + b.errors,
        totalLatency: acc.totalLatency + b.totalLatency,
      }),
      { requests: 0, errors: 0, totalLatency: 0 }
    );
    
    this.metrics.lastHour = {
      requests: totals.requests,
      errors: totals.errors,
      avgLatency: totals.requests > 0 ? totals.totalLatency / totals.requests : 0,
    };
  }
  
  private cleanupHourlyBuckets(): void {
    const oneHourAgo = Date.now() - 3600000;
    this.hourlyBuckets = this.hourlyBuckets.filter(b => b.timestamp.getTime() > oneHourAgo);
  }
  
  private checkAlerts(provider: AIProvider, success: boolean, error?: string): void {
    // Alert on high error rate
    const pm = this.metrics.byProvider[provider];
    const errorRate = pm.requests > 10 ? pm.errors / pm.requests : 0;
    
    if (errorRate > 0.1) {
      this.triggerAlert(`High error rate on ${provider}: ${(errorRate * 100).toFixed(1)}%`);
    }
    
    // Alert on specific errors
    if (error?.includes('Rate Limited')) {
      this.triggerAlert(`Rate limit on ${provider}`);
    }
  }
  
  private async triggerAlert(message: string): Promise<void> {
    console.warn(`[Monitor] 🚨 ALERT: ${message}`);
    
    this.emit({
      type: 'alert.triggered',
      timestamp: new Date(),
      data: { message },
    });
    
    // Send webhook if configured
    if (this.config.alertWebhook) {
      try {
        await fetch(this.config.alertWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alert: message, timestamp: new Date().toISOString() }),
        });
      } catch (e) {
        console.error('[Monitor] Failed to send webhook alert:', e);
      }
    }
  }
}
