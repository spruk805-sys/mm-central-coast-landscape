/**
 * Orchestrator Agent
 * Routes requests to the best available AI model based on load, health, and cost
 */

import { Agent, AIProvider, ModelConfig, AnalysisRequest, AnalysisResult } from './types';
import { MonitorAgent } from './monitor';

// Default model configurations
const DEFAULT_MODELS: ModelConfig[] = [
  {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    maxTokens: 8192,
    costPer1kTokens: 0.00025,
    timeout: 30000,
    enabled: true,
  },
  {
    provider: 'openai',
    model: 'gpt-4o',
    maxTokens: 4096,
    costPer1kTokens: 0.005,
    timeout: 30000,
    enabled: true,
  },
];

export class OrchestratorAgent implements Agent {
  name = 'Orchestrator';
  
  private models: ModelConfig[];
  private monitor: MonitorAgent;
  private activeRequests: Map<string, { provider: AIProvider; startTime: number }> = new Map();
  private providerCooldowns: Map<AIProvider, number> = new Map();
  
  constructor(
    private config: { models?: ModelConfig[]; maxConcurrent: number },
    monitor: MonitorAgent
  ) {
    this.models = (config.models && config.models.length > 0) ? config.models : DEFAULT_MODELS;
    this.monitor = monitor;
  }
  
  async start(): Promise<void> {
    console.log('[Orchestrator] Starting with models:', this.models.map(m => m.provider).join(', '));
  }
  
  async stop(): Promise<void> {
    console.log('[Orchestrator] Stopping...');
  }
  
  getStatus(): { healthy: boolean; details: Record<string, unknown> } {
    const availableModels = this.getAvailableProviders();
    return {
      healthy: availableModels.length > 0,
      details: {
        activeRequests: this.activeRequests.size,
        availableModels,
        cooldowns: Object.fromEntries(this.providerCooldowns),
      },
    };
  }
  
  /**
   * Select the best provider for a request
   */
  selectProvider(request: AnalysisRequest): AIProvider | null {
    const available = this.getAvailableProviders();
    
    if (available.length === 0) {
      console.warn('[Orchestrator] No providers available!');
      return null;
    }
    
    // Priority handling
    if (request.priority === 'urgent' || request.priority === 'high') {
      // Use the fastest provider (lowest average latency)
      return this.selectFastestProvider(available);
    }
    
    // Standard: use cost-optimized routing
    return this.selectCheapestProvider(available);
  }
  
  /**
   * Get list of available (healthy, not in cooldown) providers
   */
  private getAvailableProviders(): AIProvider[] {
    const now = Date.now();
    
    return this.models
      .filter(m => m.enabled)
      .filter(m => {
        // Check cooldown
        const cooldownUntil = this.providerCooldowns.get(m.provider) || 0;
        if (now < cooldownUntil) return false;
        
        // Check health
        const health = this.monitor.getProviderHealth(m.provider);
        return health !== 'down';
      })
      .map(m => m.provider);
  }
  
  private selectFastestProvider(available: AIProvider[]): AIProvider {
    const metrics = this.monitor.getMetrics();
    
    let fastest: AIProvider = available[0];
    let lowestLatency = Infinity;
    
    for (const provider of available) {
      const pm = metrics.byProvider[provider];
      if (pm.avgLatency < lowestLatency && pm.avgLatency > 0) {
        lowestLatency = pm.avgLatency;
        fastest = provider;
      }
    }
    
    return fastest;
  }
  
  private selectCheapestProvider(available: AIProvider[]): AIProvider {
    let cheapest: AIProvider = available[0];
    let lowestCost = Infinity;
    
    for (const provider of available) {
      const model = this.models.find(m => m.provider === provider);
      if (model && model.costPer1kTokens < lowestCost) {
        lowestCost = model.costPer1kTokens;
        cheapest = provider;
      }
    }
    
    return cheapest;
  }
  
  /**
   * Execute analysis with the selected provider
   */
  async execute(
    request: AnalysisRequest,
    provider: AIProvider,
    executor: (provider: AIProvider, request: AnalysisRequest) => Promise<AnalysisResult>
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    this.activeRequests.set(request.id, { provider, startTime });
    
    console.log(`[Orchestrator] Executing request ${request.id} with ${provider}`);
    
    try {
      const result = await executor(provider, request);
      
      // Record success
      const latency = Date.now() - startTime;
      
      // Calculate metrics
      const tokens = result.tokenUsage ? (result.tokenUsage.input + result.tokenUsage.output) : 0;
      const modelConfig = this.getModelConfig(provider);
      const cost = tokens > 0 && modelConfig ? (tokens / 1000) * modelConfig.costPer1kTokens : 0;
      
      // Add cost to result if available
      if (typeof result.cost === 'undefined') result.cost = cost;

      this.monitor.recordRequest(provider, latency, true, tokens, cost);
      
      return result;
      
    } catch (error: unknown) {
      const latency = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Record failure
      this.monitor.recordRequest(provider, latency, false, 0, 0, errorMsg);
      
      // Handle rate limiting
      if (errorMsg.includes('Rate Limited') || errorMsg.includes('429')) {
        this.setCooldown(provider, 60000); // 1 minute cooldown
        this.monitor.recordRateLimit(provider);
      }
      
      throw error;
      
    } finally {
      this.activeRequests.delete(request.id);
    }
  }
  
  /**
   * Execute with automatic fallback to other providers
   */
  async executeWithFallback(
    request: AnalysisRequest,
    executor: (provider: AIProvider, request: AnalysisRequest) => Promise<AnalysisResult>
  ): Promise<AnalysisResult> {
    const tried: AIProvider[] = [];
    
    while (true) {
      const available = this.getAvailableProviders().filter(p => !tried.includes(p));
      
      if (available.length === 0) {
        throw new Error(`All providers failed. Tried: ${tried.join(', ')}`);
      }
      
      const provider = request.priority === 'urgent' 
        ? this.selectFastestProvider(available)
        : this.selectCheapestProvider(available);
      
      tried.push(provider);
      
      try {
        return await this.execute(request, provider, executor);
      } catch (error: unknown) {
        console.warn(`[Orchestrator] ${provider} failed, trying next...`, error instanceof Error ? error.message : String(error));
        // Continue to next provider
      }
    }
  }
  
  /**
   * Set a cooldown period for a provider
   */
  setCooldown(provider: AIProvider, durationMs: number): void {
    this.providerCooldowns.set(provider, Date.now() + durationMs);
    console.log(`[Orchestrator] ${provider} in cooldown for ${durationMs / 1000}s`);
  }
  
  /**
   * Get model configuration for a provider
   */
  getModelConfig(provider: AIProvider): ModelConfig | undefined {
    return this.models.find(m => m.provider === provider);
  }
}
