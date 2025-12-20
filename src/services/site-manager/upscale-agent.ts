import Replicate from 'replicate';
import { Agent } from './types';

interface UpscaleConfig {
  apiKey?: string;
  enabled: boolean;
}

export class UpscaleAgent implements Agent {
  name = 'Upscale';
  private replicate: Replicate | null = null;
  private config: UpscaleConfig;
  private cache: Map<string, string> = new Map(); // url -> upscaledUrl
  private isRunning = false;
  
  // Real-ESRGAN model version
  private readonly MODEL_VERSION = "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73ab415c7253d1253711d";

  constructor(config: UpscaleConfig = { enabled: true }) {
    this.config = config;
    // Don't initialize client here to avoid build errors if env var is missing during build
  }

  async start(): Promise<void> {
    console.log('[Upscale] Starting agent...');
    
    // Initialize Replicate client
    const apiKey = this.config.apiKey || process.env.REPLICATE_API_TOKEN;
    
    if (apiKey && this.config.enabled) {
      try {
        this.replicate = new Replicate({ auth: apiKey });
        this.isRunning = true;
        console.log('[Upscale] Agent started and connected to Replicate');
      } catch (err) {
        console.warn('[Upscale] Failed to initialize Replicate client:', err);
        this.isRunning = false;
      }
    } else {
      console.log('[Upscale] Agent disabled or missing API key');
      this.isRunning = false;
    }
  }

  async stop(): Promise<void> {
    console.log('[Upscale] Stopping...');
    this.isRunning = false;
    this.cache.clear();
  }

  getStatus(): { healthy: boolean; details: Record<string, unknown> } {
    return {
      healthy: this.isRunning && !!this.replicate,
      details: {
        enabled: this.config.enabled,
        cachedImages: this.cache.size,
      },
    };
  }

  /**
   * Upscale an image from a URL
   * @param imageUrl Publicly accessible URL of the image
   * @param scale Scale factor (default 4)
   * @returns URL of upscaled image
   */
  async upscaleImage(imageUrl: string, scale: number = 4): Promise<string> {
    if (!this.isRunning || !this.replicate) {
      throw new Error('Upscale agent is not active');
    }

    // Check cache
    const cacheKey = `${imageUrl}-${scale}`;
    if (this.cache.has(cacheKey)) {
      console.log(`[Upscale] Serving from cache: ${imageUrl}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`[Upscale] Processing image: ${imageUrl}`);

    try {
      // Run the model
      const output = await this.replicate.run(
        this.MODEL_VERSION,
        {
          input: {
            image: imageUrl,
            scale: scale,
            face_enhance: false, // Set to true for street view with people? Generally false for satellite.
          }
        }
      );

      // Replicate returns output as string (URL) or string[] depending on model
      // Real-ESRGAN returns a string URL
      const upscaledUrl = String(output);
      
      this.cache.set(cacheKey, upscaledUrl);
      return upscaledUrl;

    } catch (error) {
      console.error('[Upscale] Failed to upscale:', error);
      throw error;
    }
  }
}
