/**
 * Features Agent
 * Specializes in detecting, validating, and enriching property features
 * Works with Quality Agent to ensure accurate feature identification
 */

import { Agent, AnalysisResult, AIProvider } from './types';
import { PropertyAnalysis } from '@/types/property';

// Feature types we track
export type FeatureType = 
  // Landscaping
  | 'tree' | 'bush' | 'pool' | 'fence' | 'driveway' 
  | 'pathway' | 'garden_bed' | 'lawn' | 'patio' | 'shed'
  // Dump / Junk
  | 'mattress' | 'furniture' | 'appliance' | 'box_pile' | 'trash_bag' | 'construction_debris' | 'tire';

export interface DetectedFeature {
  type: FeatureType;
  confidence: number;
  location?: { x: number; y: number; w: number; h: number };
  source: AIProvider | 'consensus';
  notes?: string;
  service?: 'landscaping' | 'dump';
}

export interface FeatureValidation {
  feature: FeatureType;
  isValid: boolean;
  issues: string[];
  adjustedValue?: number | boolean;
}

// Expected ranges for features based on property size
const FEATURE_RANGES: Record<FeatureType, { min: number; max: number; perAcre?: number; service: 'landscaping' | 'dump' }> = {
  // Landscaping
  tree: { min: 0, max: 100, perAcre: 50, service: 'landscaping' },
  bush: { min: 0, max: 200, perAcre: 100, service: 'landscaping' },
  pool: { min: 0, max: 3, service: 'landscaping' },
  fence: { min: 0, max: 2000, service: 'landscaping' }, // feet
  driveway: { min: 0, max: 1, service: 'landscaping' },
  pathway: { min: 0, max: 5000, service: 'landscaping' }, // sqft
  garden_bed: { min: 0, max: 20, service: 'landscaping' },
  lawn: { min: 0, max: 500000, service: 'landscaping' }, // sqft
  patio: { min: 0, max: 3, service: 'landscaping' },
  shed: { min: 0, max: 5, service: 'landscaping' },

  // Dump
  mattress: { min: 0, max: 10, service: 'dump' },
  furniture: { min: 0, max: 20, service: 'dump' },
  appliance: { min: 0, max: 10, service: 'dump' },
  box_pile: { min: 0, max: 20, service: 'dump' },
  trash_bag: { min: 0, max: 50, service: 'dump' },
  construction_debris: { min: 0, max: 5, service: 'dump' }, // piles
  tire: { min: 0, max: 20, service: 'dump' },
};

export class FeaturesAgent implements Agent {
  name = 'Features';
  
  private detectedFeatures: Map<string, DetectedFeature[]> = new Map();
  private stats = {
    totalDetections: 0,
    validatedFeatures: 0,
    correctedFeatures: 0,
  };
  
  constructor() {}
  
  async start(): Promise<void> {
    console.log('[Features] Starting feature detection agent');
  }
  
  async stop(): Promise<void> {
    console.log('[Features] Stopping...');
    this.detectedFeatures.clear();
  }
  
  getStatus(): { healthy: boolean; details: Record<string, unknown> } {
    return {
      healthy: true,
      details: {
        trackedRequests: this.detectedFeatures.size,
        stats: this.stats,
      },
    };
  }
  
  /**
   * Extract features from analysis result
   */
  extractFeatures(requestId: string, result: AnalysisResult): DetectedFeature[] {
    const features: DetectedFeature[] = [];
    const analysis = result.analysis as unknown as PropertyAnalysis;
    
    if (!analysis) return features;
    
    // Extract count-based features
    if (analysis.treeCount > 0) {
      features.push({
        type: 'tree',
        confidence: result.confidence,
        source: result.provider,
        notes: `Count: ${analysis.treeCount}`,
        service: 'landscaping'
      });
    }
    
    if (analysis.bushCount > 0) {
      features.push({
        type: 'bush',
        confidence: result.confidence,
        source: result.provider,
        notes: `Count: ${analysis.bushCount}`,
        service: 'landscaping'
      });
    }
    
    if (analysis.gardenBeds > 0) {
      features.push({
        type: 'garden_bed',
        confidence: result.confidence,
        source: result.provider,
        notes: `Count: ${analysis.gardenBeds}`,
        service: 'landscaping'
      });
    }

    // --- DUMP / JUNK FEATURES ---
    if ((analysis.mattressCount || 0) > 0) {
      features.push({
        type: 'mattress',
        confidence: result.confidence,
        source: result.provider,
        notes: `Count: ${analysis.mattressCount}`,
        service: 'dump'
      });
    }

    if ((analysis.furnitureCount || 0) > 0) {
      features.push({
        type: 'furniture',
        confidence: result.confidence,
        source: result.provider,
        notes: `Count: ${analysis.furnitureCount}`,
        service: 'dump'
      });
    }

    if ((analysis.applianceCount || 0) > 0) {
      features.push({
        type: 'appliance',
        confidence: result.confidence,
        source: result.provider,
        notes: `Count: ${analysis.applianceCount}`,
        service: 'dump'
      });
    }
    
    if ((analysis.trashBagCount || 0) > 0) {
      features.push({
        type: 'trash_bag',
        confidence: result.confidence,
        source: result.provider,
        notes: `Count: ${analysis.trashBagCount}`,
        service: 'dump'
      });
    }

    if ((analysis.debrisPiles || 0) > 0) {
      features.push({
        type: 'construction_debris',
        confidence: result.confidence,
        source: result.provider,
        notes: `Count: ${analysis.debrisPiles}`,
        service: 'dump'
      });
    }
    
    // Extract boolean features
    if (analysis.hasPool) {
      features.push({
        type: 'pool',
        confidence: result.confidence,
        source: result.provider,
      });
    }
    
    if (analysis.hasFence) {
      features.push({
        type: 'fence',
        confidence: result.confidence,
        source: result.provider,
        notes: `Length: ${analysis.fenceLength}ft`,
      });
    }
    
    if (analysis.drivewayPresent) {
      features.push({
        type: 'driveway',
        confidence: result.confidence,
        source: result.provider,
      });
    }
    
    // Extract area features
    if (analysis.lawnSqft > 0) {
      features.push({
        type: 'lawn',
        confidence: result.confidence,
        source: result.provider,
        notes: `Area: ${analysis.lawnSqft} sqft`,
      });
    }
    
    if (analysis.pathwaySqft > 0) {
      features.push({
        type: 'pathway',
        confidence: result.confidence,
        source: result.provider,
        notes: `Area: ${analysis.pathwaySqft} sqft`,
      });
    }
    
    // Extract location-based features if available
    if (analysis.locations && Array.isArray(analysis.locations)) {
      for (const loc of analysis.locations) {
        if (loc.type && ['tree', 'bush', 'pool', 'shed', 'patio'].includes(loc.type)) {
          features.push({
            type: loc.type as FeatureType,
            confidence: result.confidence,
            location: { x: loc.x, y: loc.y, w: loc.w || 5, h: loc.h || 5 },
            source: result.provider,
          });
        }
      }
    }
    
    this.detectedFeatures.set(requestId, features);
    this.stats.totalDetections += features.length;
    
    console.log(`[Features] Extracted ${features.length} features for ${requestId}`);
    
    return features;
  }
  
  /**
   * Validate a feature value against expected ranges
   */
  validateFeature(
    feature: FeatureType,
    value: number | boolean,
    propertyAcres?: number
  ): FeatureValidation {
    const issues: string[] = [];
    const range = FEATURE_RANGES[feature];
    
    if (!range) {
      return { feature, isValid: true, issues: [] };
    }
    
    // Boolean validation
    if (typeof value === 'boolean') {
      return { feature, isValid: true, issues: [] };
    }
    
    // Numeric validation
    if (value < range.min) {
      issues.push(`${feature} value ${value} is below minimum ${range.min}`);
    }
    
    if (value > range.max) {
      issues.push(`${feature} value ${value} exceeds maximum ${range.max}`);
    }
    
    // Per-acre validation if property size is known
    if (propertyAcres && range.perAcre) {
      const expectedMax = Math.ceil(propertyAcres * range.perAcre * 1.5); // 50% buffer
      if (value > expectedMax) {
        issues.push(`${feature} count ${value} seems high for ${propertyAcres} acres`);
      }
    }
    
    const isValid = issues.length === 0;
    
    if (!isValid) {
      this.stats.correctedFeatures++;
      console.log(`[Features] Validation issue: ${issues.join(', ')}`);
    }
    
    this.stats.validatedFeatures++;
    
    return { 
      feature, 
      isValid, 
      issues,
      adjustedValue: isValid ? value : Math.min(value, range.max),
    };
  }
  
  /**
   * Compare features from multiple sources
   */
  compareFeatures(requestId: string, results: AnalysisResult[]): {
    agreements: FeatureType[];
    disagreements: { feature: FeatureType; values: unknown[] }[];
  } {
    const featureValues = new Map<FeatureType, { value: unknown; source: string }[]>();
    
    for (const result of results) {
      const analysis = result.analysis as unknown as PropertyAnalysis;
      if (!analysis) continue;
      
      // Track each feature
      const features: [FeatureType, unknown][] = [
        ['tree', analysis.treeCount],
        ['bush', analysis.bushCount],
        ['pool', analysis.hasPool],
        ['fence', analysis.hasFence],
        ['lawn', analysis.lawnSqft],
      ];
      
      for (const [feature, value] of features) {
        if (!featureValues.has(feature)) {
          featureValues.set(feature, []);
        }
        featureValues.get(feature)!.push({ value, source: result.provider });
      }
    }
    
    const agreements: FeatureType[] = [];
    const disagreements: { feature: FeatureType; values: unknown[] }[] = [];
    
    for (const [feature, values] of featureValues) {
      const uniqueValues = [...new Set(values.map(v => {
        // For numbers, use threshold comparison
        if (typeof v.value === 'number') {
          return Math.round(v.value / 10) * 10; // Round to nearest 10
        }
        return v.value;
      }))];
      
      if (uniqueValues.length === 1) {
        agreements.push(feature);
      } else {
        disagreements.push({ feature, values: values.map(v => v.value) });
      }
    }
    
    return { agreements, disagreements };
  }
  
  /**
   * Get features for a request
   */
  getFeatures(requestId: string): DetectedFeature[] {
    return this.detectedFeatures.get(requestId) || [];
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }
}
