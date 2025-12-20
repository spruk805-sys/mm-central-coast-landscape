/**
 * Data Scraping Agent
 * Searches for better images, APIs, and data sources to improve mapping quality
 */

import { Agent } from './types';

export type DataSourceType = 'image' | 'api' | 'parcel' | 'aerial' | 'street_view' | 'property_data';

export interface DataSource {
  id: string;
  type: DataSourceType;
  name: string;
  url: string;
  quality: 'low' | 'medium' | 'high' | 'premium';
  cost: 'free' | 'freemium' | 'paid';
  coverage: string; // e.g., "US", "Global", "California"
  resolution?: string; // For images
  updateFrequency?: string;
  apiKey?: boolean; // Whether API key is required
  enabled: boolean;
  lastChecked?: Date;
  status: 'active' | 'degraded' | 'down' | 'unknown';
}

export interface ScrapedData {
  sourceId: string;
  type: DataSourceType;
  propertyId: string;
  data: Record<string, unknown>;
  quality: number; // 0-1
  fetchedAt: Date;
}

// Known data sources for property data
const KNOWN_SOURCES: DataSource[] = [
  {
    id: 'google_static',
    type: 'image',
    name: 'Google Static Maps',
    url: 'https://maps.googleapis.com/maps/api/staticmap',
    quality: 'high',
    cost: 'freemium',
    coverage: 'Global',
    resolution: '640x640',
    apiKey: true,
    enabled: true,
    status: 'active',
  },
  {
    id: 'google_aerial',
    type: 'aerial',
    name: 'Google Aerial View',
    url: 'https://aerialview.googleapis.com',
    quality: 'premium',
    cost: 'paid',
    coverage: 'US',
    apiKey: true,
    enabled: true,
    status: 'active',
  },
  {
    id: 'regrid',
    type: 'parcel',
    name: 'Regrid Parcel Data',
    url: 'https://app.regrid.com/api/v2',
    quality: 'high',
    cost: 'freemium',
    coverage: 'US',
    updateFrequency: 'Monthly',
    apiKey: true,
    enabled: true,
    status: 'active',
  },
  {
    id: 'mapbox_satellite',
    type: 'image',
    name: 'Mapbox Satellite',
    url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9',
    quality: 'high',
    cost: 'freemium',
    coverage: 'Global',
    resolution: '1280x1280',
    apiKey: true,
    enabled: false,
    status: 'unknown',
  },
  {
    id: 'nearmap',
    type: 'aerial',
    name: 'Nearmap High-Res Aerial',
    url: 'https://api.nearmap.com',
    quality: 'premium',
    cost: 'paid',
    coverage: 'US, AU',
    resolution: '5.5cm/px',
    updateFrequency: 'Quarterly',
    apiKey: true,
    enabled: false,
    status: 'unknown',
  },
  {
    id: 'zillow',
    type: 'property_data',
    name: 'Zillow Property Data',
    url: 'https://www.zillow.com',
    quality: 'medium',
    cost: 'free',
    coverage: 'US',
    enabled: false,
    status: 'unknown',
  },
  {
    id: 'openstreetmap',
    type: 'parcel',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org',
    quality: 'medium',
    cost: 'free',
    coverage: 'Global',
    enabled: true,
    status: 'active',
  },
];

export class DataScrapingAgent implements Agent {
  name = 'DataScraping';
  
  private sources: DataSource[];
  private scrapedData: Map<string, ScrapedData[]> = new Map();
  private stats = {
    totalFetches: 0,
    successfulFetches: 0,
    failedFetches: 0,
    avgQuality: 0,
  };
  
  constructor() {
    this.sources = [...KNOWN_SOURCES];
  }
  
  async start(): Promise<void> {
    console.log(`[DataScraping] Starting with ${this.sources.length} known sources`);
  }
  
  async stop(): Promise<void> {
    console.log('[DataScraping] Stopping...');
  }
  
  getStatus(): { healthy: boolean; details: Record<string, unknown> } {
    const activeSources = this.sources.filter(s => s.enabled && s.status === 'active');
    return {
      healthy: activeSources.length > 0,
      details: {
        totalSources: this.sources.length,
        activeSources: activeSources.length,
        stats: this.stats,
      },
    };
  }
  
  /**
   * Get all known data sources
   */
  getSources(): DataSource[] {
    return [...this.sources];
  }
  
  /**
   * Get enabled sources of a specific type
   */
  getSourcesByType(type: DataSourceType): DataSource[] {
    return this.sources.filter(s => s.type === type && s.enabled);
  }
  
  /**
   * Find the best available image source
   */
  getBestImageSource(): DataSource | null {
    const imageSources = this.sources
      .filter(s => (s.type === 'image' || s.type === 'aerial') && s.enabled && s.status === 'active')
      .sort((a, b) => {
        const qualityOrder = { premium: 4, high: 3, medium: 2, low: 1 };
        return qualityOrder[b.quality] - qualityOrder[a.quality];
      });
    
    return imageSources[0] || null;
  }
  
  /**
   * Search for new data sources (simulated)
   */
  async discoverNewSources(): Promise<DataSource[]> {
    console.log('[DataScraping] Searching for new data sources...');
    
    // In a real implementation, this would:
    // 1. Search for new property data APIs
    // 2. Check for new aerial imagery providers
    // 3. Find region-specific sources
    
    const discovered: DataSource[] = [];
    
    // Example: Check for state-specific GIS portals
    const stateGISPortals = [
      { state: 'CA', url: 'https://gis.data.ca.gov' },
      { state: 'TX', url: 'https://tnris.org/data-catalog' },
    ];
    
    for (const portal of stateGISPortals) {
      if (!this.sources.find(s => s.url === portal.url)) {
        const newSource: DataSource = {
          id: `gis_${portal.state.toLowerCase()}`,
          type: 'parcel',
          name: `${portal.state} State GIS`,
          url: portal.url,
          quality: 'medium',
          cost: 'free',
          coverage: portal.state,
          enabled: false,
          status: 'unknown',
        };
        discovered.push(newSource);
        this.sources.push(newSource);
      }
    }
    
    console.log(`[DataScraping] Discovered ${discovered.length} new sources`);
    return discovered;
  }
  
  /**
   * Check health of all sources
   */
  async checkSourceHealth(): Promise<void> {
    console.log('[DataScraping] Checking source health...');
    
    for (const source of this.sources) {
      source.lastChecked = new Date();
      
      // In a real implementation, this would ping the API
      // For now, mark enabled sources as active
      if (source.enabled) {
        source.status = 'active';
      }
    }
  }
  
  /**
   * Fetch data from a specific source
   */
  async fetchFromSource(
    sourceId: string,
    lat: number,
    lng: number,
    propertyId: string
  ): Promise<ScrapedData | null> {
    const source = this.sources.find(s => s.id === sourceId);
    if (!source || !source.enabled) {
      return null;
    }
    
    this.stats.totalFetches++;
    
    try {
      // In a real implementation, this would make actual API calls
      // For now, return mock data
      
      const data: ScrapedData = {
        sourceId,
        type: source.type,
        propertyId,
        data: { lat, lng, source: source.name },
        quality: source.quality === 'premium' ? 1.0 : source.quality === 'high' ? 0.8 : 0.6,
        fetchedAt: new Date(),
      };
      
      // Store the data
      const existing = this.scrapedData.get(propertyId) || [];
      existing.push(data);
      this.scrapedData.set(propertyId, existing);
      
      this.stats.successfulFetches++;
      this.updateAvgQuality(data.quality);
      
      return data;
    } catch (error) {
      this.stats.failedFetches++;
      console.error(`[DataScraping] Failed to fetch from ${sourceId}:`, error);
      return null;
    }
  }
  
  /**
   * Get all data for a property
   */
  getPropertyData(propertyId: string): ScrapedData[] {
    return this.scrapedData.get(propertyId) || [];
  }
  
  /**
   * Get recommendations for improving data quality
   */
  getRecommendations(): {
    source: DataSource;
    reason: string;
  }[] {
    const recommendations = [];
    
    // Recommend premium sources that aren't enabled
    const premiumDisabled = this.sources.filter(
      s => s.quality === 'premium' && !s.enabled
    );
    
    for (const source of premiumDisabled) {
      recommendations.push({
        source,
        reason: `Enable ${source.name} for ${source.resolution || 'premium quality'} imagery`,
      });
    }
    
    // Recommend free sources that aren't enabled
    const freeDisabled = this.sources.filter(
      s => s.cost === 'free' && !s.enabled
    );
    
    for (const source of freeDisabled) {
      recommendations.push({
        source,
        reason: `Enable ${source.name} as a free backup data source`,
      });
    }
    
    return recommendations;
  }
  
  /**
   * Enable a data source
   */
  enableSource(sourceId: string): boolean {
    const source = this.sources.find(s => s.id === sourceId);
    if (source) {
      source.enabled = true;
      console.log(`[DataScraping] Enabled source: ${source.name}`);
      return true;
    }
    return false;
  }
  
  /**
   * Disable a data source
   */
  disableSource(sourceId: string): boolean {
    const source = this.sources.find(s => s.id === sourceId);
    if (source) {
      source.enabled = false;
      console.log(`[DataScraping] Disabled source: ${source.name}`);
      return true;
    }
    return false;
  }
  
  private updateAvgQuality(newQuality: number): void {
    const total = this.stats.successfulFetches;
    this.stats.avgQuality = 
      (this.stats.avgQuality * (total - 1) + newQuality) / total;
  }
}
