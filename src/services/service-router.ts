import { PropertyAnalysis } from '@/types/property';
import { ServiceType } from './site-manager/types';
import { ItemizationEngine } from './itemization-engine';
import { PricingMonitorAgent } from './hauling-manager/pricing-monitor';
import { DetectedItem as HaulingItem } from './hauling-manager/types';
import { DetectedItem as SiteItem } from './site-manager/types';

import { SafetyAgent, SafetyAnalysisResult } from './site-manager/safety-agent';
import { AccessAgent, AccessLogistics } from './site-manager/access-agent';
import { SeasonalityAgent, SeasonalRecommendation } from './site-manager/seasonality-agent';
import { ItemsAgent } from './site-manager/items-agent';

export interface RouterResult {
  service: ServiceType;
  items: HaulingItem[];
  quote?: any; // PricingBreakdown
  recommendations: string[];
  safety?: SafetyAnalysisResult;
  access?: AccessLogistics;
  seasonality?: SeasonalRecommendation;
}

export class ServiceRouter {
  private itemizationEngine: ItemizationEngine;
  private pricingMonitor: PricingMonitorAgent;
  private safetyAgent: SafetyAgent;
  private accessAgent: AccessAgent;
  private seasonalityAgent: SeasonalityAgent;
  private itemsAgent: ItemsAgent;

  constructor() {
    this.itemizationEngine = new ItemizationEngine();
    this.pricingMonitor = new PricingMonitorAgent();
    this.safetyAgent = new SafetyAgent();
    this.accessAgent = new AccessAgent();
    this.seasonalityAgent = new SeasonalityAgent();
    this.itemsAgent = new ItemsAgent();
    this.itemsAgent.start(); // Ensure agent is started
  }

  /**
   * Route the analysis to the appropriate service handler
   */
  public async routeAnalysis(
    analysis: PropertyAnalysis, 
    service: ServiceType,
    address: string = ''
  ): Promise<RouterResult> {
    console.log(`[ServiceRouter] Routing analysis for service: ${service}`);

    // Run parallel agent analysis
    const context = analysis.notes.join(' ');
    const [safety, access, seasonality] = await Promise.all([
      this.safetyAgent.analyzeSafety(context),
      this.accessAgent.analyzeAccess(address),
      this.seasonalityAgent.analyzeSeasonality()
    ]);

    // 1. Convert PropertyAnalysis to SiteItems (for filtering)
    // Now async due to ItemsAgent LLM lookups
    const rawSiteItems = await this.convertAnalysisToSiteItems(analysis);

    // 2. Filter using ItemizationEngine (works on SiteItems)
    const filteredSiteItems = this.itemizationEngine.limitToService(rawSiteItems, service);

    // 3. Convert to HaulingItems (richer format for pricing)
    const haulingItems = this.convertToHaulingItems(filteredSiteItems);

    let result: RouterResult;

    if (service === 'dump') {
      result = this.handleDumpService(haulingItems);
    } else {
      result = this.handleLandscapingService(haulingItems, analysis);
    }

    // Attach agent insights
    result.safety = safety;
    result.access = access;
    result.seasonality = seasonality;

    // Refine recommendations based on agents
    if (seasonality.urgency === 'high') {
       result.recommendations.unshift(...seasonality.recommendedServices.map(s => `Urgent: ${s}`));
    }
    if (!safety.safeToProceed) {
       result.recommendations.unshift('⚠️ SAFETY HAZARD: Site Prep Required');
    }

    return result;
  }

  private async convertAnalysisToSiteItems(analysis: PropertyAnalysis): Promise<SiteItem[]> {
    const items: SiteItem[] = [];
    
    // Map existing detected locations from AI Consensus
    if (analysis.locationsByImage?.image1) {
       // Parallel processing for speed
       const promises = analysis.locationsByImage.image1.map(async (loc, i) => {
         const determinedService = await this.itemsAgent.classifyItem(loc.type);
         return {
           id: `loc-${i}`,
           label: loc.type,
           confidence: 0.9,
           service: determinedService, 
         };
       });
       
       const results = await Promise.all(promises);
       items.push(...results);
    }

    // Also check user photos (for dump items)
    if (analysis.locationsByImage?.userPhotos) {
       // @ts-ignore
       const promises = analysis.locationsByImage.userPhotos.map(async (loc, i) => {
         const determinedService = await this.itemsAgent.classifyItem(loc.type);
         return {
           id: `user-loc-${i}`,
           label: loc.type,
           confidence: 0.9,
           service: determinedService,
         };
       });
       
       const results = await Promise.all(promises);
       items.push(...results);
    }

    // Map string notes used as loose observations
    analysis.notes.forEach((note) => {
       const detected = this.itemsAgent.detectItemsFromText(note);
       items.push(...detected);
    });

    return items;
  }

  private convertToHaulingItems(siteItems: SiteItem[]): HaulingItem[] {
    return siteItems.map(item => ({
      id: item.id,
      name: item.label, // map label -> name
      category: 'other', // default, needs better classification agent in future
      quantity: 1,
      estimatedWeight: 50, // default lbs
      estimatedVolume: 10, // default cu ft
      dimensions: { l: 0, w: 0, h: 0 },
      disposalMethod: 'dump',
      confidence: item.confidence,
      donatable: false,
      recyclable: false,
      hazardous: false
    }));
  }

  private handleDumpService(items: HaulingItem[]): RouterResult {
    // 2. Estimate Load
    // Mock load estimate for MVP
    const totalVolume = items.length * 10;
    
    const loadEstimate: any = {
      totalVolume,
      totalWeight: items.length * 50,
      truckCapacityUsed: (totalVolume / 400) * 100, // assume 400 cu ft truck
      vehicleRequired: 'pickup' as const, 
      crewSize: 2,
      estimatedLoadTime: 30,
      equipmentNeeded: [],
      safetyRisks: []
    };

    // Auto-scale vehicle based on volume
    if (loadEstimate.totalVolume > 100) loadEstimate.vehicleRequired = 'box_truck';

    // 3. Calculate Price
    const quote = this.pricingMonitor.calculatePricing(items, loadEstimate);

    return {
      service: 'dump',
      items,
      quote,
      recommendations: ['Schedule pickup within 24h for discount']
    };
  }

  private handleLandscapingService(items: HaulingItem[], originalAnalysis: PropertyAnalysis): RouterResult {
    const recommendations: string[] = [];
    
    if (originalAnalysis.lawnSqft > 5000) recommendations.push('Weekly Mowing Plan');
    if (originalAnalysis.treeCount > 3) recommendations.push('Seasonal Pruning');
    if (originalAnalysis.hasPool) recommendations.push('Pool Maintenance Add-on');

    return {
      service: 'landscaping',
      items,
      recommendations
    };
  }
}
