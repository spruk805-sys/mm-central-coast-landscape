/**
 * Quote Generator Agent
 * Assembles final quotes from all agent inputs
 */

import { HaulingAgent, DetectedItem, LoadEstimate, PricingBreakdown, HaulingQuote } from './types';
import { v4 as uuidv4 } from 'uuid';

export class QuoteGeneratorAgent implements HaulingAgent {
  name = 'QuoteGenerator';
  
  private quotes: Map<string, HaulingQuote> = new Map();
  private stats = {
    quotesGenerated: 0,
    avgConfidence: 0,
  };
  
  async start(): Promise<void> {
    console.log('[QuoteGenerator] Starting quote generator');
  }
  
  async stop(): Promise<void> {
    console.log('[QuoteGenerator] Stopping...');
  }
  
  getStatus() {
    return {
      healthy: true,
      details: {
        quotesStored: this.quotes.size,
        stats: this.stats,
      },
    };
  }
  
  /**
   * Generate a complete quote
   */
  generateQuote(
    items: DetectedItem[],
    loadEstimate: LoadEstimate,
    pricing: PricingBreakdown
  ): HaulingQuote {
    const quoteId = uuidv4();
    
    // Organize items by disposal method
    const disposalPlan = {
      dumpItems: items.filter(i => i.disposalMethod === 'dump'),
      donateItems: items.filter(i => i.disposalMethod === 'donate'),
      recycleItems: items.filter(i => i.disposalMethod === 'recycle'),
      hazmatItems: items.filter(i => i.disposalMethod === 'hazmat'),
    };
    
    // Calculate overall confidence
    const avgConfidence = items.length > 0
      ? items.reduce((sum, i) => sum + i.confidence, 0) / items.length
      : 0.7;
    
    // Generate notes
    const notes = this.generateNotes(items, loadEstimate, disposalPlan);
    
    const quote: HaulingQuote = {
      id: quoteId,
      items,
      loadEstimate,
      pricing,
      disposalPlan,
      notes,
      confidence: avgConfidence,
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
    
    this.quotes.set(quoteId, quote);
    this.updateStats(avgConfidence);
    
    console.log(`[QuoteGenerator] Quote ${quoteId} generated: $${pricing.lowEstimate}-$${pricing.highEstimate}`);
    
    return quote;
  }
  
  /**
   * Generate helpful notes
   */
  private generateNotes(
    items: DetectedItem[],
    loadEstimate: LoadEstimate,
    disposalPlan: HaulingQuote['disposalPlan']
  ): string[] {
    const notes: string[] = [];
    
    // Vehicle note
    const vehicleNames: Record<string, string> = {
      pickup: 'Pickup truck',
      pickup_trailer: 'Pickup with trailer',
      dump_trailer: 'Dump trailer',
      box_truck: '16ft box truck',
      roll_off: 'Roll-off dumpster',
    };
    notes.push(`${vehicleNames[loadEstimate.vehicleRequired]} recommended for this load`);
    
    // Crew note
    notes.push(`${loadEstimate.crewSize} crew member${loadEstimate.crewSize > 1 ? 's' : ''} needed`);
    
    // Donation note
    if (disposalPlan.donateItems.length > 0) {
      const donateCount = disposalPlan.donateItems.reduce((sum, i) => sum + i.quantity, 0);
      notes.push(`${donateCount} item(s) can be donated to charity`);
    }
    
    // Recycling note
    if (disposalPlan.recycleItems.length > 0) {
      notes.push(`${disposalPlan.recycleItems.length} item(s) can be recycled`);
    }
    
    // Hazmat warning
    if (disposalPlan.hazmatItems.length > 0) {
      notes.push(`⚠️ ${disposalPlan.hazmatItems.length} item(s) require special hazmat disposal`);
    }
    
    // Heavy item warning
    const heavyItems = items.filter(i => i.estimatedWeight > 100);
    if (heavyItems.length > 0) {
      notes.push(`Heavy items present - specialty equipment included`);
    }
    
    // Time estimate
    const hours = Math.round(loadEstimate.estimatedLoadTime / 60 * 10) / 10;
    notes.push(`Estimated load time: ${hours} hour${hours !== 1 ? 's' : ''}`);
    
    return notes;
  }
  
  /**
   * Update statistics
   */
  private updateStats(confidence: number): void {
    this.stats.quotesGenerated++;
    this.stats.avgConfidence = 
      (this.stats.avgConfidence * (this.stats.quotesGenerated - 1) + confidence) / 
      this.stats.quotesGenerated;
  }
  
  /**
   * Get a stored quote
   */
  getQuote(quoteId: string): HaulingQuote | null {
    return this.quotes.get(quoteId) || null;
  }
  
  /**
   * Get all quotes
   */
  getAllQuotes(): HaulingQuote[] {
    return Array.from(this.quotes.values());
  }
}
