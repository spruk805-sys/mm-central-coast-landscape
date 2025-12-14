/**
 * Boundary Enforcement Agent
 * Filters AI-detected features to only include those within the property boundary
 * Uses parcel polygon from Regrid API to determine property boundaries
 */

import type { FeatureLocation, PropertyAnalysis } from '@/types/property';

export interface ParcelPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [[[lng, lat], [lng, lat], ...]]
}

export interface BoundaryConfig {
  parcelPolygon?: ParcelPolygon;
  imageWidth?: number;  // pixels (default 640)
  imageHeight?: number; // pixels (default 640)
  centerLat: number;
  centerLng: number;
  zoom: number; // Google Maps zoom level
}

export interface BoundaryStats {
  totalFeatures: number;
  featuresInBoundary: number;
  featuresFiltered: number;
  boundarySource: 'parcel' | 'estimated' | 'none';
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function pointInPolygon(x: number, y: number, polygon: number[][]): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Convert lat/lng to pixel coordinates on a Google Static Maps image
 */
function latLngToPixel(
  lat: number, 
  lng: number, 
  centerLat: number, 
  centerLng: number, 
  zoom: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  const TILE_SIZE = 256;
  const scale = Math.pow(2, zoom);
  
  // World coordinates
  const worldCoordinateCenter = {
    x: TILE_SIZE * (0.5 + centerLng / 360),
    y: TILE_SIZE * (0.5 - Math.log(Math.tan(Math.PI / 4 + centerLat * Math.PI / 360)) / (2 * Math.PI))
  };
  
  const worldCoordinatePoint = {
    x: TILE_SIZE * (0.5 + lng / 360),
    y: TILE_SIZE * (0.5 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / (2 * Math.PI))
  };
  
  // Pixel offset from center
  const pixelOffset = {
    x: (worldCoordinatePoint.x - worldCoordinateCenter.x) * scale,
    y: (worldCoordinatePoint.y - worldCoordinateCenter.y) * scale
  };
  
  // Convert to image coordinates (0, 0) = top-left
  return {
    x: imageWidth / 2 + pixelOffset.x,
    y: imageHeight / 2 + pixelOffset.y
  };
}

/**
 * Convert parcel polygon (lat/lng) to image pixel coordinates
 */
function parcelToImagePolygon(
  parcel: ParcelPolygon,
  config: BoundaryConfig
): number[][] {
  const imageWidth = config.imageWidth || 640;
  const imageHeight = config.imageHeight || 640;
  
  // Use outer ring of polygon
  const ring = parcel.coordinates[0];
  
  return ring.map(([lng, lat]) => {
    const pixel = latLngToPixel(lat, lng, config.centerLat, config.centerLng, config.zoom, imageWidth, imageHeight);
    return [pixel.x, pixel.y];
  });
}

/**
 * Create an estimated boundary polygon (centered rectangle)
 * Used when no parcel data is available
 */
function createEstimatedBoundary(
  imageWidth: number = 640,
  imageHeight: number = 640,
  paddingPercent: number = 15
): number[][] {
  const padding = imageWidth * (paddingPercent / 100);
  return [
    [padding, padding],
    [imageWidth - padding, padding],
    [imageWidth - padding, imageHeight - padding],
    [padding, imageHeight - padding],
    [padding, padding] // Close the polygon
  ];
}

export class BoundaryEnforcementAgent {
  private lastStats: BoundaryStats = {
    totalFeatures: 0,
    featuresInBoundary: 0,
    featuresFiltered: 0,
    boundarySource: 'none'
  };

  /**
   * Filter feature locations to only include those within the property boundary
   */
  filterLocations(
    locations: FeatureLocation[],
    config: BoundaryConfig,
    imageWidth: number = 640,
    imageHeight: number = 640
  ): FeatureLocation[] {
    if (!locations || locations.length === 0) {
      this.lastStats = { totalFeatures: 0, featuresInBoundary: 0, featuresFiltered: 0, boundarySource: 'none' };
      return [];
    }

    // Determine boundary polygon
    let boundaryPolygon: number[][];
    let boundarySource: 'parcel' | 'estimated';
    
    if (config.parcelPolygon) {
      boundaryPolygon = parcelToImagePolygon(config.parcelPolygon, { ...config, imageWidth, imageHeight });
      boundarySource = 'parcel';
      console.log(`[BoundaryAgent] Using parcel polygon with ${boundaryPolygon.length} points`);
    } else {
      boundaryPolygon = createEstimatedBoundary(imageWidth, imageHeight);
      boundarySource = 'estimated';
      console.log('[BoundaryAgent] Using estimated boundary (no parcel data)');
    }

    // Filter locations that fall within the boundary
    const filtered = locations.filter(loc => {
      // Convert percentage coords to pixels
      const pixelX = (loc.x / 100) * imageWidth;
      const pixelY = (loc.y / 100) * imageHeight;
      
      // Check if center point is inside boundary
      const inside = pointInPolygon(pixelX, pixelY, boundaryPolygon);
      
      if (!inside) {
        console.log(`[BoundaryAgent] Filtered out ${loc.type} at (${loc.x.toFixed(1)}%, ${loc.y.toFixed(1)}%) - outside boundary`);
      }
      
      return inside;
    });

    this.lastStats = {
      totalFeatures: locations.length,
      featuresInBoundary: filtered.length,
      featuresFiltered: locations.length - filtered.length,
      boundarySource
    };

    console.log(`[BoundaryAgent] Kept ${filtered.length}/${locations.length} features (filtered ${this.lastStats.featuresFiltered})`);
    
    return filtered;
  }

  /**
   * Filter SAM polygon masks to only include those substantially within the boundary
   */
  filterSAMMasks(
    masks: { polygon: number[][]; type: string; confidence: number; color?: string }[],
    config: BoundaryConfig,
    imageWidth: number = 640,
    imageHeight: number = 640,
    overlapThreshold: number = 0.5  // Require 50% of points inside
  ): typeof masks {
    if (!masks || masks.length === 0) return [];

    let boundaryPolygon: number[][];
    
    if (config.parcelPolygon) {
      boundaryPolygon = parcelToImagePolygon(config.parcelPolygon, { ...config, imageWidth, imageHeight });
    } else {
      boundaryPolygon = createEstimatedBoundary(imageWidth, imageHeight);
    }

    return masks.filter(mask => {
      if (!mask.polygon || mask.polygon.length === 0) return false;
      
      // Check what percentage of mask points are inside boundary
      let insideCount = 0;
      for (const point of mask.polygon) {
        if (pointInPolygon(point[0], point[1], boundaryPolygon)) {
          insideCount++;
        }
      }
      
      const overlapRatio = insideCount / mask.polygon.length;
      const keep = overlapRatio >= overlapThreshold;
      
      if (!keep) {
        console.log(`[BoundaryAgent] Filtered ${mask.type} mask - only ${(overlapRatio * 100).toFixed(0)}% inside boundary`);
      }
      
      return keep;
    });
  }

  /**
   * Apply boundary filtering to entire PropertyAnalysis
   */
  enforcePropertyBoundary(
    analysis: PropertyAnalysis,
    config: BoundaryConfig
  ): PropertyAnalysis {
    const imageWidth = 640;
    const imageHeight = 640;
    
    // Clone the analysis to avoid mutation
    const filtered = { ...analysis };
    
    // Filter legacy locations
    if (filtered.locations) {
      filtered.locations = this.filterLocations(filtered.locations, config, imageWidth, imageHeight);
    }
    
    // Filter per-image locations
    if (filtered.locationsByImage) {
      const zoomLevels: Record<string, number> = { image1: 21, image2: 20, image3: 19 };
      
      filtered.locationsByImage = {
        image1: filtered.locationsByImage.image1 
          ? this.filterLocations(filtered.locationsByImage.image1, { ...config, zoom: zoomLevels.image1 }, imageWidth, imageHeight)
          : undefined,
        image2: filtered.locationsByImage.image2
          ? this.filterLocations(filtered.locationsByImage.image2, { ...config, zoom: zoomLevels.image2 }, imageWidth, imageHeight)
          : undefined,
        image3: filtered.locationsByImage.image3
          ? this.filterLocations(filtered.locationsByImage.image3, { ...config, zoom: zoomLevels.image3 }, imageWidth, imageHeight)
          : undefined,
      };
    }
    
    // Filter SAM masks per image
    if (filtered.samMasksByImage) {
      const zoomLevels: Record<string, number> = { image1: 21, image2: 20, image3: 19 };
      
      filtered.samMasksByImage = {
        image1: filtered.samMasksByImage.image1
          ? this.filterSAMMasks(filtered.samMasksByImage.image1, { ...config, zoom: zoomLevels.image1 }, imageWidth, imageHeight)
          : undefined,
        image2: filtered.samMasksByImage.image2
          ? this.filterSAMMasks(filtered.samMasksByImage.image2, { ...config, zoom: zoomLevels.image2 }, imageWidth, imageHeight)
          : undefined,
        image3: filtered.samMasksByImage.image3
          ? this.filterSAMMasks(filtered.samMasksByImage.image3, { ...config, zoom: zoomLevels.image3 }, imageWidth, imageHeight)
          : undefined,
      };
    }
    
    // Add note about boundary enforcement
    filtered.notes = [
      ...(filtered.notes || []),
      `[Boundary] Enforced property boundary (${this.lastStats.boundarySource}): filtered ${this.lastStats.featuresFiltered} features`
    ];
    
    return filtered;
  }

  getStats(): BoundaryStats {
    return this.lastStats;
  }
}

// Singleton instance
let boundaryAgent: BoundaryEnforcementAgent | null = null;

export function getBoundaryAgent(): BoundaryEnforcementAgent {
  if (!boundaryAgent) {
    boundaryAgent = new BoundaryEnforcementAgent();
  }
  return boundaryAgent;
}
