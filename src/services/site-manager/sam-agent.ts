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
   * Segment an image using text prompts via Roboflow SAM API
   * Note: Roboflow SAM requires specific endpoint format
   */
  async segmentWithText(
    imageBase64: string,
    prompts: string[],
    mimeType = 'image/jpeg'
  ): Promise<SegmentationResult[]> {
    if (!this.apiKey) {
      console.warn('[SAMAgent] No API key - returning empty results');
      return [];
    }
    
    const startTime = Date.now();
    const results: SegmentationResult[] = [];
    
    try {
      // Roboflow SAM2 endpoint with api_key as query param
      // Using the segment_image endpoint for SAM
      const endpoint = `https://infer.roboflow.com/sam2/segment_image?api_key=${this.apiKey}`;
      
      for (const prompt of prompts) {
        console.log(`[SAMAgent] Segmenting: "${prompt}"`);
        
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: {
                type: 'base64',
                value: imageBase64,
              },
              text_prompt: prompt,
              multimask_output: false,
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[SAMAgent] API error for "${prompt}":`, response.status, errorText);
            continue;
          }
          
          const data = await response.json();
          console.log(`[SAMAgent] Response for "${prompt}":`, JSON.stringify(data).substring(0, 200));
          
          // Handle various response formats
          if (data.mask) {
            results.push({
              type: prompt,
              mask: data.mask,
              maskUrl: data.mask_url,
              area: data.area || 0,
              percentage: data.percentage || 0,
              confidence: data.confidence || 0.8,
              bounds: data.bounds || { x: 0, y: 0, w: 100, h: 100 },
            });
          } else if (data.masks && data.masks.length > 0) {
            for (const mask of data.masks) {
              results.push({
                type: prompt,
                mask: mask.mask || mask.mask_base64 || '',
                maskUrl: mask.mask_url,
                area: mask.area || 0,
                percentage: mask.percentage || 0,
                confidence: mask.confidence || 0.8,
                bounds: mask.bounds || { x: 0, y: 0, w: 100, h: 100 },
              });
            }
          } else if (data.segmentation) {
            // Alternative format
            results.push({
              type: prompt,
              mask: data.segmentation.mask || '',
              area: data.segmentation.area || 0,
              percentage: data.segmentation.percentage || 0,
              confidence: data.segmentation.confidence || 0.8,
              bounds: data.segmentation.bounds || { x: 0, y: 0, w: 100, h: 100 },
            });
          }
        } catch (promptError) {
          console.error(`[SAMAgent] Error for prompt "${prompt}":`, promptError);
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
