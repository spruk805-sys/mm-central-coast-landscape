/**
 * Site Manager Agent
 * Central orchestrator that manages all AI operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SiteManagerConfig,
  SystemStatus,
  AnalysisRequest,
  AnalysisResult,
  Priority,
  AIProvider,
} from './types';
import { MonitorAgent } from './monitor';
import { OrchestratorAgent } from './orchestrator';
import { AutoScalerAgent } from './auto-scaler';
import { QualityAgent } from './quality-agent';
import { FeaturesAgent } from './features-agent';

// AI API Executors
async function executeGemini(request: AnalysisRequest): Promise<any> {
  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');

  const parts: any[] = [{ text: buildPrompt(request) }];
  
  // Add images
  for (const img of request.images) {
    parts.push({ text: `\n--- IMAGE: ${img.label} ---\n` });
    parts.push({ inline_data: { mime_type: img.mime, data: img.data } });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
      }),
    }
  );

  if (res.status === 429) throw new Error('Rate Limited');
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return parseAIResponse(text);
}

async function executeOpenAI(request: AnalysisRequest): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const content: any[] = [{ type: 'text', text: buildPrompt(request) }];
  
  for (const img of request.images) {
    content.push({ type: 'text', text: `\n--- IMAGE: ${img.label} ---\n` });
    content.push({
      type: 'image_url',
      image_url: { url: `data:${img.mime};base64,${img.data}`, detail: 'high' },
    });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content }],
      max_tokens: 2048,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (res.status === 429) throw new Error('Rate Limited');
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);

  const data = await res.json();
  return parseAIResponse(data.choices[0].message.content);
}

function buildPrompt(request: AnalysisRequest): string {
  return `You are an expert landscaping property analyst. Analyze the images of this property.

**PROPERTY:**
Address: ${request.address || 'Unknown'}
Coordinates: ${request.lat}, ${request.lng}

**INSTRUCTIONS:**
1. Analyze EACH image carefully.
2. Only count features INSIDE the property boundary (if visible).
3. Return conservative estimates.

**REQUIRED JSON OUTPUT:**
{
  "lawnSqft": <number>,
  "treeCount": <number>,
  "bushCount": <number>,
  "hasPool": <boolean>,
  "hasFence": <boolean>,
  "fenceLength": <number>,
  "pathwaySqft": <number>,
  "gardenBeds": <number>,
  "drivewayPresent": <boolean>,
  "confidence": <0.0-1.0>,
  "notes": [<string>]
}`;
}

function parseAIResponse(text: string): any {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const json = JSON.parse(cleaned);
  
  return {
    lawnSqft: Math.max(0, Math.round(json.lawnSqft || 0)),
    treeCount: Math.max(0, Math.round(json.treeCount || 0)),
    bushCount: Math.max(0, Math.round(json.bushCount || 0)),
    hasPool: Boolean(json.hasPool),
    hasFence: Boolean(json.hasFence),
    fenceLength: Math.max(0, Math.round(json.fenceLength || 0)),
    pathwaySqft: Math.max(0, Math.round(json.pathwaySqft || 0)),
    gardenBeds: Math.max(0, Math.round(json.gardenBeds || 0)),
    drivewayPresent: Boolean(json.drivewayPresent),
    confidence: Math.min(1, Math.max(0, json.confidence || 0.7)),
    notes: Array.isArray(json.notes) ? json.notes : [],
  };
}

// Default configuration
const DEFAULT_CONFIG: SiteManagerConfig = {
  models: [],
  maxConcurrent: 5,
  qualityThreshold: 0.6,
  enableMetrics: true,
  logLevel: 'info',
};

export class SiteManager {
  private config: SiteManagerConfig;
  private monitor: MonitorAgent;
  private orchestrator: OrchestratorAgent;
  private startedAt: Date;
  private isRunning = false;

  constructor(config: Partial<SiteManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startedAt = new Date();
    
    // Initialize agents
    this.monitor = new MonitorAgent({
      alertWebhook: this.config.alertWebhook,
      logLevel: this.config.logLevel,
    });
    
    this.orchestrator = new OrchestratorAgent(
      { models: this.config.models, maxConcurrent: this.config.maxConcurrent },
      this.monitor
    );
  }

  /**
   * Start the Site Manager and all agents
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.log('[SiteManager] Starting...');
    await this.monitor.start();
    await this.orchestrator.start();
    this.isRunning = true;
    console.log('[SiteManager] Started successfully');
  }

  /**
   * Stop the Site Manager
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('[SiteManager] Stopping...');
    await this.orchestrator.stop();
    await this.monitor.stop();
    this.isRunning = false;
  }

  /**
   * Analyze a property with automatic provider selection and fallback
   */
  async analyze(params: {
    images: { mime: string; data: string; label: string }[];
    address: string;
    lat: number;
    lng: number;
    parcelData?: any;
    priority?: Priority;
    retryOnLowConfidence?: boolean;
  }): Promise<AnalysisResult> {
    const request: AnalysisRequest = {
      id: uuidv4(),
      images: params.images,
      address: params.address,
      lat: params.lat,
      lng: params.lng,
      parcelData: params.parcelData,
      priority: params.priority || 'standard',
      retryOnLowConfidence: params.retryOnLowConfidence ?? true,
      createdAt: new Date(),
    };

    console.log(`[SiteManager] Analyzing property: ${params.address} (${request.id})`);

    // Execute with orchestrator (automatic fallback)
    const result = await this.orchestrator.executeWithFallback(
      request,
      this.createExecutor()
    );

    // Check quality threshold
    if (
      params.retryOnLowConfidence &&
      result.confidence < this.config.qualityThreshold
    ) {
      console.log(`[SiteManager] Low confidence (${result.confidence}), re-analyzing...`);
      // TODO: Implement Quality Agent retry logic
    }

    return result;
  }

  private createExecutor() {
    return async (
      provider: AIProvider,
      request: AnalysisRequest
    ): Promise<AnalysisResult> => {
      const startTime = Date.now();
      
      let analysis: any;
      
      if (provider === 'gemini') {
        analysis = await executeGemini(request);
      } else if (provider === 'openai') {
        analysis = await executeOpenAI(request);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      return {
        requestId: request.id,
        provider,
        model: provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o',
        analysis,
        confidence: analysis.confidence || 0.7,
        latencyMs: Date.now() - startTime,
      };
    };
  }

  /**
   * Get system status and metrics
   */
  getStatus(): SystemStatus {
    const monitorStatus = this.monitor.getStatus();
    const orchestratorStatus = this.orchestrator.getStatus();
    const metrics = this.monitor.getMetrics();

    return {
      healthy: monitorStatus.healthy && orchestratorStatus.healthy,
      status: monitorStatus.healthy ? 'healthy' : 'degraded',
      activeWorkers: orchestratorStatus.details.activeRequests,
      queueDepth: 0, // TODO: Implement queue in Phase 2
      providers: {
        gemini: {
          status: this.monitor.getProviderHealth('gemini'),
          errorRate: metrics.byProvider.gemini.errors / (metrics.byProvider.gemini.requests || 1),
        },
        openai: {
          status: this.monitor.getProviderHealth('openai'),
          errorRate: metrics.byProvider.openai.errors / (metrics.byProvider.openai.requests || 1),
        },
        claude: { status: 'healthy', errorRate: 0 },
        local: { status: 'healthy', errorRate: 0 },
      },
      metrics,
      uptime: Date.now() - this.startedAt.getTime(),
      startedAt: this.startedAt,
    };
  }

  /**
   * Get the Monitor agent for external event listening
   */
  getMonitor(): MonitorAgent {
    return this.monitor;
  }
}

// Singleton instance
let instance: SiteManager | null = null;

export function getSiteManager(config?: Partial<SiteManagerConfig>): SiteManager {
  if (!instance) {
    instance = new SiteManager(config);
    instance.start().catch(console.error);
  }
  return instance;
}
