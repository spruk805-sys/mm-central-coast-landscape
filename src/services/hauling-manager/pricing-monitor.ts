/**
 * Pricing Monitor Agent
 * Tracks disposal costs, dump fees, and generates pricing
 */

import { HaulingAgent, PricingRates, PricingBreakdown, LoadEstimate, DetectedItem } from './types';

// Default pricing rates
const DEFAULT_RATES: PricingRates = {
  laborPerHour: 75,
  dumpFeePerTon: 65,
  pickupRate: 50,
  trailerRate: 100,
  boxTruckRate: 150,
  rollOffRate: 350,
  minimumCharge: 150,
};

// Disposal fees by type
const DISPOSAL_FEES: Record<string, number> = {
  dump: 0, // Included in dump fee
  donate: 0, // Free
  recycle: 10, // Per item recycling fee
  hazmat: 50, // Per item hazmat handling
};

export class PricingMonitorAgent implements HaulingAgent {
  name = 'PricingMonitor';
  
  private rates: PricingRates;
  private stats = {
    quotesGenerated: 0,
    totalRevenue: 0,
    avgQuoteValue: 0,
  };
  
  constructor(rates: Partial<PricingRates> = {}) {
    this.rates = { ...DEFAULT_RATES, ...rates };
  }
  
  async start(): Promise<void> {
    console.log('[PricingMonitor] Starting pricing monitor');
  }
  
  async stop(): Promise<void> {
    console.log('[PricingMonitor] Stopping...');
  }
  
  getStatus() {
    return {
      healthy: true,
      details: {
        currentRates: this.rates,
        stats: this.stats,
      },
    };
  }
  
  /**
   * Calculate pricing breakdown
   */
  calculatePricing(items: DetectedItem[], loadEstimate: LoadEstimate): PricingBreakdown {
    // Labor cost
    const hours = loadEstimate.estimatedLoadTime / 60;
    const laborCost = Math.round(hours * this.rates.laborPerHour * loadEstimate.crewSize);
    
    // Vehicle cost
    const vehicleCost = this.getVehicleCost(loadEstimate.vehicleRequired);
    
    // Disposal fees
    const disposalFees = this.calculateDisposalFees(items, loadEstimate.totalWeight);
    
    // Equipment cost (included in labor for simplicity)
    const equipmentCost = loadEstimate.equipmentNeeded.length > 3 ? 25 : 0;
    
    // Fuel estimate
    const fuelEstimate = 15; // Base fuel cost
    
    // Calculate totals
    const subtotal = laborCost + disposalFees + vehicleCost + equipmentCost + fuelEstimate;
    const tax = Math.round(subtotal * 0.08); // 8% tax
    const total = Math.max(this.rates.minimumCharge, subtotal + tax);
    
    // Range estimates
    const lowEstimate = Math.round(total * 0.85);
    const highEstimate = Math.round(total * 1.25);
    
    this.stats.quotesGenerated++;
    this.stats.totalRevenue += total;
    this.stats.avgQuoteValue = this.stats.totalRevenue / this.stats.quotesGenerated;
    
    return {
      laborCost,
      disposalFees,
      vehicleCost,
      equipmentCost,
      fuelEstimate,
      subtotal,
      tax,
      total,
      lowEstimate,
      highEstimate,
    };
  }
  
  /**
   * Get vehicle cost
   */
  private getVehicleCost(vehicle: LoadEstimate['vehicleRequired']): number {
    const costs: Record<LoadEstimate['vehicleRequired'], number> = {
      pickup: this.rates.pickupRate,
      pickup_trailer: this.rates.trailerRate,
      dump_trailer: this.rates.trailerRate * 1.5,
      box_truck: this.rates.boxTruckRate,
      roll_off: this.rates.rollOffRate,
    };
    return costs[vehicle];
  }
  
  /**
   * Calculate disposal fees
   */
  private calculateDisposalFees(items: DetectedItem[], totalWeight: number): number {
    // Base dump fee (by weight)
    const tons = totalWeight / 2000;
    let fees = Math.round(tons * this.rates.dumpFeePerTon);
    
    // Add per-item fees for special disposal
    for (const item of items) {
      const feePerItem = DISPOSAL_FEES[item.disposalMethod] || 0;
      fees += feePerItem * item.quantity;
    }
    
    return fees;
  }
  
  /**
   * Update pricing rates
   */
  updateRates(newRates: Partial<PricingRates>): void {
    this.rates = { ...this.rates, ...newRates };
    console.log('[PricingMonitor] Rates updated');
  }
  
  /**
   * Get current rates
   */
  getRates(): PricingRates {
    return { ...this.rates };
  }
}
