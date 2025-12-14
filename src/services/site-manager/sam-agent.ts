/**
 * SAM Agent - Segment Anything Model Integration
 * Uses Roboflow's hosted SAM API for precise segmentation
 */

import { HaulingAgent } from '../hauling-manager/types';

export interface SegmentationPrompt {
  type: 'text' | 'box' | 'point';
  value: string | { x: number; y: number; w?: number; h?: number };
}

export interface SegmentationResult {
  type: string;
  mask: string; // Base64 PNG mask
  maskUrl?: string;
  area: number; // pixels
  percentage: number; // of total image
  confidence: number;
  bounds: { x: number; y: number; w: number; h: number };
}

export interface SAMConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class SAMAgent implements HaulingAgent {
  name = 'SAMAgent';
  
  private apiKey: string;
  private baseUrl: string;
  
  private stats = {
    segmentationsCompleted: 0,
    avgLatencyMs: 0,
    masksGenerated: 0,
  };
  
  constructor(config?: SAMConfig) {
    this.apiKey = config?.apiKey || process.env.ROBOFLOW_API_KEY || '';
    this.baseUrl = config?.baseUrl || 'https://api.roboflow.com';
  }
  
  async start(): Promise<void> {
    console.log('[SAMAgent] Starting SAM segmentation agent');
    if (!this.apiKey) {
      console.warn('[SAMAgent] No ROBOFLOW_API_KEY configured - SAM features disabled');
    }
  }
  
  async stop(): Promise<void> {
    console.log('[SAMAgent] Stopping...');
  }
  
  getStatus() {
    return {
      healthy: !!this.apiKey,
      details: {
        hasApiKey: !!this.apiKey,
        stats: this.stats,
      },
    };
  }
  
  /**
   * Segment an image using text prompts via Roboflow SAM 3 API
   * Endpoint: https://serverless.roboflow.com/sam3/concept_segment
   */
  async segmentWithText(
    imageBase64: string,
    prompts: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mimeType = 'image/jpeg'
  ): Promise<SegmentationResult[]> {
    if (!this.apiKey) {
      console.warn('[SAMAgent] No API key - returning empty results');
      return [];
    }
    
    const startTime = Date.now();
    const results: SegmentationResult[] = [];
    
    try {
      // SAM 3 Concept Segmentation endpoint
      const endpoint = `https://serverless.roboflow.com/sam3/concept_segment?api_key=${this.apiKey}`;
      
      // Build prompts array for SAM 3
      const sam3Prompts = prompts.map(text => ({ text }));
      
      console.log(`[SAMAgent] Calling SAM 3 with prompts:`, prompts);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'mask', // Request mask format
          image: {
            type: 'base64',
            value: imageBase64,
          },
          prompts: sam3Prompts,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SAMAgent] SAM 3 API error:`, response.status, errorText);
        return [];
      }
      
      const data = await response.json();
      console.log(`[SAMAgent] SAM 3 response keys:`, Object.keys(data));
      
      // SAM 3 returns prompt_results array
      if (data.prompt_results && Array.isArray(data.prompt_results)) {
        for (let i = 0; i < data.prompt_results.length; i++) {
          const promptResult = data.prompt_results[i];
          const promptText = prompts[i] || 'unknown';
          
          if (promptResult.predictions && Array.isArray(promptResult.predictions)) {
            for (const pred of promptResult.predictions) {
              // Handle mask data
              if (pred.mask || pred.masks) {
                const maskData = pred.mask || (pred.masks && pred.masks[0]);
                results.push({
                  type: promptText,
                  mask: typeof maskData === 'string' ? maskData : JSON.stringify(maskData),
                  maskUrl: pred.mask_url,
                  area: pred.area || 0,
                  percentage: pred.percentage || 0,
                  confidence: pred.confidence || 0.8,
                  bounds: pred.bbox ? {
                    x: pred.bbox.x || 0,
                    y: pred.bbox.y || 0,
                    w: pred.bbox.width || 100,
                    h: pred.bbox.height || 100,
                  } : { x: 0, y: 0, w: 100, h: 100 },
                });
              }
            }
          }
        }
      }
      
      // Update stats
      const latency = Date.now() - startTime;
      this.stats.segmentationsCompleted++;
      this.stats.masksGenerated += results.length;
      this.stats.avgLatencyMs = 
        (this.stats.avgLatencyMs * (this.stats.segmentationsCompleted - 1) + latency) / 
        this.stats.segmentationsCompleted;
      
      console.log(`[SAMAgent] Generated ${results.length} masks in ${latency}ms`);
      
    } catch (error) {
      console.error('[SAMAgent] Segmentation error:', error);
    }
    
    return results;
  }
  
  /**
   * Segment using bounding box prompts (from AI detection)
   */
  async segmentWithBoxes(
    imageBase64: string,
    boxes: { type: string; x: number; y: number; w: number; h: number }[],
    mimeType = 'image/jpeg'
  ): Promise<SegmentationResult[]> {
    if (!this.apiKey) {
      return [];
    }
    
    const results: SegmentationResult[] = [];
    
    try {
      const endpoint = `${this.baseUrl}/sam/segment`;
      
      for (const box of boxes) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            image: `data:${mimeType};base64,${imageBase64}`,
            box: {
              x_min: box.x,
              y_min: box.y,
              x_max: box.x + box.w,
              y_max: box.y + box.h,
            },
            return_mask: true,
          }),
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.masks && data.masks.length > 0) {
          const mask = data.masks[0];
          results.push({
            type: box.type,
            mask: mask.mask_base64 || '',
            maskUrl: mask.mask_url,
            area: mask.area || 0,
            percentage: mask.percentage || 0,
            confidence: mask.confidence || 0.8,
            bounds: { x: box.x, y: box.y, w: box.w, h: box.h },
          });
        }
      }
    } catch (error) {
      console.error('[SAMAgent] Box segmentation error:', error);
    }
    
    return results;
  }
  
  /**
   * Segment landscape features (convenience method)
   */
  async segmentLandscapeFeatures(imageBase64: string): Promise<SegmentationResult[]> {
    const landscapePrompts = [
      'lawn grass',
      'tree',
      'swimming pool',
      'fence',
      'driveway',
      'garden bed',
    ];
    
    return this.segmentWithText(imageBase64, landscapePrompts);
  }
}

// Singleton instance
let instance: SAMAgent | null = null;

export function getSAMAgent(): SAMAgent {
  if (!instance) {
    instance = new SAMAgent();
    instance.start().catch(console.error);
  }
  return instance;
}
