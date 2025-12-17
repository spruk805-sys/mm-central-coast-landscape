import Replicate from "replicate";
import { Agent, VideoAnalysisResult, DetectedItem, ServiceType } from './types';

export class VideoAgent implements Agent {
  name = 'Video';
  private replicate: Replicate;
  private isProcessing = false;

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }

  async start(): Promise<void> {
    console.log('[VideoAgent] Starting...');
    if (!process.env.REPLICATE_API_TOKEN) {
      console.warn('[VideoAgent] No REPLICATE_API_TOKEN found. Video features will be disabled.');
    }
  }

  async stop(): Promise<void> {
    console.log('[VideoAgent] Stopping...');
    this.isProcessing = false;
  }

  getStatus(): { healthy: boolean; details: Record<string, unknown> } {
    return {
      healthy: !!process.env.REPLICATE_API_TOKEN,
      details: {
        isProcessing: this.isProcessing
      }
    };
  }

  /**
   * Process a video to detect items based on the service type
   * @param videoUrl URL of the uploaded video
   * @param service 'landscaping' or 'dump'
   */
  async analyzeVideo(videoUrl: string, service: ServiceType): Promise<VideoAnalysisResult> {
    this.isProcessing = true;
    const startTime = Date.now();
    console.log(`[VideoAgent] Analyzing video for ${service}: ${videoUrl}`);

    try {
      // Prompt logic based on service
      const prompt = service === 'landscaping' 
        ? "trees, bushes, swimming pool, fence, lawn, patio"
        : "mattress, furniture, cardboard boxes, appliances, trash bags, construction debris";

      // Call SAM 3 Video model via Replicate
      // Using lucataco/sam3-video
      const output = await this.replicate.run(
        "lucataco/sam3-video:8e8e747d63994dc6922a4666ca99a37bc944eb2d85b1a72d3f02492f2549a60e",
        {
          input: {
            video: videoUrl,
            prompts: prompt,
            // Additional params for output format can be tuned here
          }
        }
      );

      // MOCK PARSING for now until we see exact API response structure
      // The API returns masks/tracking data. 
      // For this MVP step, we will assume we get a list of detected objects.
      // In a real implementation we would parse the JSON output from Replicate.
      
      console.log('[VideoAgent] Replicate output:', output);

      // Simulating a parsed response for the MVP phase
      const simulatedItems: DetectedItem[] = this.mockItemsForService(service);

      return {
        videoId: videoUrl,
        items: simulatedItems,
        summary: `Computed for ${service} using SAM 3`,
        processingTime: Date.now() - startTime
      };

    } catch (error: unknown) {
      console.error('[VideoAgent] Error processing video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        videoId: videoUrl,
        items: [],
        summary: `Analysis failed: ${errorMessage}`,
        processingTime: Date.now() - startTime,
        error: errorMessage
      };
    } finally {
      this.isProcessing = false;
    }
  }

  // TODO: Replace with real parsing logic once we have actual Replicate output samples
  private mockItemsForService(service: ServiceType): DetectedItem[] {
    if (service === 'landscaping') {
      return [
        { id: '1', label: 'Large Oak Tree', confidence: 0.98, service: 'landscaping' },
        { id: '2', label: 'Swimming Pool', confidence: 0.95, service: 'landscaping' },
        { id: '3', label: 'Wooden Fence', confidence: 0.88, service: 'landscaping' }
      ];
    } else {
      return [
        { id: '1', label: 'Old Mattress', confidence: 0.99, service: 'dump' },
        { id: '2', label: 'Pile of Cardboard', confidence: 0.92, service: 'dump' },
        { id: '3', label: 'Broken Chair', confidence: 0.85, service: 'dump' }
      ];
    }
  }
}
