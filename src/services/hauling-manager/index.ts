/**
 * Hauling Manager
 * Central orchestrator for the Hauling Service
 */

import { v4 as uuidv4 } from 'uuid';
import {
  HaulingSystemStatus,
  HaulingAnalysisRequest,
  HaulingQuote,
  DetectedItem,
} from './types';
import { ItemOrchestratorAgent } from './item-orchestrator';
import { ClassificationAgent } from './classification-agent';
import { LoadEstimatorAgent } from './load-estimator';
import { PricingMonitorAgent } from './pricing-monitor';
import { QuoteGeneratorAgent } from './quote-generator';

export class HaulingManager {
  private itemOrchestrator: ItemOrchestratorAgent;
  private classifier: ClassificationAgent;
  private loadEstimator: LoadEstimatorAgent;
  private pricingMonitor: PricingMonitorAgent;
  private quoteGenerator: QuoteGeneratorAgent;
  
  private startedAt: Date;
  private isRunning = false;
  
  constructor() {
    this.startedAt = new Date();
    
    // Initialize agents
    this.itemOrchestrator = new ItemOrchestratorAgent();
    this.classifier = new ClassificationAgent();
    this.loadEstimator = new LoadEstimatorAgent();
    this.pricingMonitor = new PricingMonitorAgent();
    this.quoteGenerator = new QuoteGeneratorAgent();
  }
  
  /**
   * Start all agents
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.log('[HaulingManager] Starting...');
    
    await Promise.all([
      this.itemOrchestrator.start(),
      this.classifier.start(),
      this.loadEstimator.start(),
      this.pricingMonitor.start(),
      this.quoteGenerator.start(),
    ]);
    
    this.isRunning = true;
    console.log('[HaulingManager] Started successfully');
  }
  
  /**
   * Stop all agents
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('[HaulingManager] Stopping...');
    
    await Promise.all([
      this.itemOrchestrator.stop(),
      this.classifier.stop(),
      this.loadEstimator.stop(),
      this.pricingMonitor.stop(),
      this.quoteGenerator.stop(),
    ]);
    
    this.isRunning = false;
  }
  
  /**
   * Analyze images and generate a quote
   */
  async analyzeAndQuote(params: {
    images: { mime: string; data: string }[];
    description?: string;
    location?: { lat: number; lng: number };
  }): Promise<HaulingQuote> {
    const request: HaulingAnalysisRequest = {
      id: uuidv4(),
      images: params.images,
      description: params.description,
      location: params.location,
      createdAt: new Date(),
    };
    
    console.log(`[HaulingManager] Analyzing ${params.images.length} images (${request.id})`);
    
    // Step 1: Detect items with AI
    const rawItems = await this.itemOrchestrator.analyzeImages(request);
    
    // Step 2: Classify items
    const classifiedItems: DetectedItem[] = this.classifier.classifyItems(rawItems);
    
    // Step 3: Estimate load
    const loadEstimate = this.loadEstimator.estimateLoad(classifiedItems);
    
    // Step 4: Calculate pricing
    const pricing = this.pricingMonitor.calculatePricing(classifiedItems, loadEstimate);
    
    // Step 5: Generate quote
    const quote = this.quoteGenerator.generateQuote(classifiedItems, loadEstimate, pricing);
    
    console.log(`[HaulingManager] Quote generated: $${pricing.lowEstimate}-$${pricing.highEstimate}`);
    
    return quote;
  }
  
  /**
   * Get system status
   */
  getStatus(): HaulingSystemStatus {
    return {
      healthy: this.isRunning,
      agents: {
        itemOrchestrator: this.itemOrchestrator.getStatus(),
        classifier: this.classifier.getStatus(),
        loadEstimator: this.loadEstimator.getStatus(),
        pricingMonitor: this.pricingMonitor.getStatus(),
        quoteGenerator: this.quoteGenerator.getStatus(),
      },
      metrics: {
        totalQuotes: (this.quoteGenerator.getStatus().details.quotesStored as number) || 0,
        avgConfidence: (this.quoteGenerator.getStatus().details.stats.avgConfidence as number) || 0,
        itemsProcessed: (this.classifier.getStatus().details.itemsClassified as number) || 0,
      },
      uptime: Date.now() - this.startedAt.getTime(),
    };
  }
  
  /**
   * Get current pricing rates
   */
  getRates() {
    return this.pricingMonitor.getRates();
  }
  
  /**
   * Get a specific quote
   */
  getQuote(quoteId: string) {
    return this.quoteGenerator.getQuote(quoteId);
  }
}

// Singleton instance
let instance: HaulingManager | null = null;

export function getHaulingManager(): HaulingManager {
  if (!instance) {
    instance = new HaulingManager();
    instance.start().catch(console.error);
  }
  return instance;
}
