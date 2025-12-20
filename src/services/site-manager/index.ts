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
import { PropertyAnalysis } from '../../types/property';
import { QualityAgent } from './quality-agent';
import { FeaturesAgent } from './features-agent';
import { UpscaleAgent } from './upscale-agent';
import { VideoAgent } from './video-agent';
import { MaterialsLibraryService } from '../estimating/materials-library';
import { QuoteAgent } from './quote-agent';
import { SpatialAgent } from './spatial-agent';
import { getOperationsManager } from '../operations/manager';

// AI API Executors
async function executeGemini(request: AnalysisRequest): Promise<Record<string, unknown> & { usage: { input: number; output: number } }> {
  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');

  const parts: ( { text: string } | { inline_data: { mime_type: string; data: string } } )[] = [{ text: buildPrompt(request) }];
  
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

  const usage = data.usageMetadata;
  const analysis = parseAIResponse(text);
  
  return { ...analysis, usage: { input: usage?.promptTokenCount || 0, output: usage?.candidatesTokenCount || 0 } };
}

async function executeOpenAI(request: AnalysisRequest): Promise<Record<string, unknown> & { usage: { input: number; output: number } }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const content: ( { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail: string } } )[] = [{ type: 'text', text: buildPrompt(request) }];
  
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
  const analysis = parseAIResponse(data.choices[0].message.content);
  const usage = data.usage;
  
  return { ...analysis, usage: { input: usage?.prompt_tokens || 0, output: usage?.completion_tokens || 0 } };
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

function parseAIResponse(text: string): PropertyAnalysis & { confidence: number; notes: string[] } {
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
  } as PropertyAnalysis & { confidence: number; notes: string[] };
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
  private autoScaler: AutoScalerAgent;
  private qualityAgent: QualityAgent;
  private featuresAgent: FeaturesAgent;
  private upscaleAgent: UpscaleAgent;
  private videoAgent: VideoAgent;
  private spatialAgent: SpatialAgent;
  private materialsLibrary: MaterialsLibraryService;
  private quoteAgent: QuoteAgent;
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
    
    // Initialize AutoScaler
    this.autoScaler = new AutoScalerAgent({ maxConcurrent: this.config.maxConcurrent });
    
    // Initialize Quality/Features/Upscale
    this.qualityAgent = new QualityAgent();
    this.featuresAgent = new FeaturesAgent();
    this.upscaleAgent = new UpscaleAgent({ enabled: true });
    
    // Initialize VideoAgent
    this.videoAgent = new VideoAgent();

    // Initialize Materials, Spatial & Quote Agent
    this.materialsLibrary = new MaterialsLibraryService();
    this.spatialAgent = new SpatialAgent();
    this.quoteAgent = new QuoteAgent(this.materialsLibrary);

    // Wire AutoScaler to Orchestrator
    this.autoScaler.setExecutor(async (request) => {
      const executor = this.createExecutor();
      return this.orchestrator.executeWithFallback(request, executor);
    });
  }

  /**
   * Start the Site Manager and all agents
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.log('[SiteManager] Starting...');
    await this.monitor.start();
    await this.orchestrator.start();
    await this.autoScaler.start();
    await this.upscaleAgent.start();
    await this.videoAgent.start();
    await this.spatialAgent.start();
    await this.quoteAgent.start();
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
    await this.autoScaler.stop();
    await this.upscaleAgent.stop();
    await this.videoAgent.stop();
    await this.spatialAgent.stop();
    await this.quoteAgent.stop();
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
    parcelData?: Record<string, unknown>;
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

    // Execute with AutoScaler (queuing + fallback via orchestrator)
    const result = await this.autoScaler.submit(request);

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

  /**
   * Analyze a video stream for specific items
   */
  async analyzeVideo(url: string, service: 'landscaping' | 'dump'): Promise<Record<string, unknown>> {
    const result = await this.videoAgent.analyzeVideo(url, service);
    return result as unknown as Record<string, unknown>;
  }

  /**
   * Notify the Site Manager of a Geofence event (from GPS Agent)
   * This allows the system to trigger a quote request if we've entered a new site.
   */
  async notifyGeofenceEvent(employeeId: string, siteId: string, type: 'ENTRY' | 'EXIT') {
    console.log(`[SiteManager] Received GPS Alert: ${employeeId} ${type} site ${siteId}`);
    if (type === 'ENTRY') {
      // Potentially trigger the QuoteAgent to look for new visual data
      // For MVP,เราเพียงบันทึกเหตุการณ์
    }
  }

  /**
   * Enhance an image using the UpscaleAgent
   */
  async enhanceImage(url: string): Promise<string> {
    return this.upscaleAgent.upscaleImage(url);
  }

  private createExecutor() {
    return async (
      provider: AIProvider,
      request: AnalysisRequest
    ): Promise<AnalysisResult> => {
      const startTime = Date.now();
      
      let analysis: Record<string, unknown> & { confidence?: number; usage?: { input: number; output: number } };
      
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
        tokenUsage: analysis.usage,
      };
    };
  }

  /**
   * Get system status and metrics
   */
  getStatus(): SystemStatus {
    const monitorStatus = this.monitor.getStatus();
    const orchestratorStatus = this.orchestrator.getStatus();
    const autoScalerStatus = this.autoScaler.getStatus();
    const metrics = this.monitor.getMetrics();

    return {
      healthy: monitorStatus.healthy && orchestratorStatus.healthy && (this.upscaleAgent.getStatus().healthy as boolean) && (this.videoAgent.getStatus().healthy as boolean) && (this.quoteAgent.getStatus().healthy as boolean),
      status: monitorStatus.healthy ? 'healthy' : 'degraded',
      activeWorkers: (orchestratorStatus.details.activeRequests as number) || 0,
      agents: [
        { name: 'Monitor', ...monitorStatus },
        { name: 'Orchestrator', ...orchestratorStatus },
        { name: 'AutoScaler', ...autoScalerStatus },
        { name: 'Video Vision', ...this.videoAgent.getStatus() },
        { name: 'Spatial Analyst', ...this.spatialAgent.getStatus() },
        { name: 'Quote Engine', ...this.quoteAgent.getStatus() },
        { name: 'Geofence Guardian', ...getOperationsManager().getGPSAgent().getStatus() },
        { name: 'Deployment Sentinel', ...getOperationsManager().getDeploymentAgent().getStatus() },
        { name: 'Activity Intelligence', ...getOperationsManager().getActivityAgent().getStatus() }
      ],
      upscaleStatus: this.upscaleAgent.getStatus(),
      videoStatus: this.videoAgent.getStatus(),
      quoteStatus: this.quoteAgent.getStatus(),
      gpsStatus: getOperationsManager().getGPSAgent().getStatus(),
      personnelAlerts: getOperationsManager().getDeploymentAgent().getPersonnelAlerts(),
      activeActivity: getOperationsManager().getActivityAgent().getActiveInferences(),
      jobHistory: getOperationsManager().getJobHistoryService().getAllHistory().slice(-5), // Last 5 entries
      queueDepth: Number(autoScalerStatus.details.queueDepth) || 0,
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
        consensus: {
          status: this.monitor.getProviderHealth('consensus'),
          errorRate: metrics.byProvider.consensus.errors / (metrics.byProvider.consensus.requests || 1),
        },
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
