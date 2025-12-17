import { Agent } from './types';
import { analyzeText } from '../llm-client';

export interface AccessLogistics {
  drivewayWidthFt: number;
  gateClearanceFt: number;
  overheadClearanceFt: number; // e.g., low branches
  maxTruckSize: 'pickup' | 'box_truck' | 'dump_truck' | 'semi';
  parkingNotes: string;
}

export class AccessAgent implements Agent {
  name = 'Access';
  private isProcessing = false;

  async start(): Promise<void> {
    console.log('[AccessAgent] Starting...');
  }

  async stop(): Promise<void> {
    console.log('[AccessAgent] Stopping...');
    this.isProcessing = false;
  }

  getStatus(): { healthy: boolean; details: any } {
    return {
      healthy: true,
      details: { isProcessing: this.isProcessing }
    };
  }

  /**
   * Analyze access logistics using LLM inference from address+notes
   */
  async analyzeAccess(address: string, context: string = ''): Promise<AccessLogistics> {
    this.isProcessing = true;
    try {
      console.log(`[AccessAgent] Analyzing access for: ${address}`);
      
      const prompt = `Analyze access logistics for a property at "${address}". 
      Context/Notes: "${context}".
      Estimate driveway width, gate clearance, truck access based on typical residential patterns or specific notes.`;

      const schema = `{
        "drivewayWidthFt": number,
        "gateClearanceFt": number,
        "overheadClearanceFt": number,
        "maxTruckSize": "pickup" | "box_truck" | "dump_truck" | "semi",
        "parkingNotes": string
      }`;

      const result = await analyzeText<AccessLogistics>(prompt, schema);

      if (result) {
        return {
           drivewayWidthFt: result.drivewayWidthFt || 12,
           gateClearanceFt: result.gateClearanceFt || 4,
           overheadClearanceFt: result.overheadClearanceFt || 14,
           maxTruckSize: result.maxTruckSize || 'box_truck',
           parkingNotes: result.parkingNotes || 'Standard residential access inferred.'
        };
      }
      
      // Fallback
      return {
        drivewayWidthFt: 12,
        gateClearanceFt: 4,
        overheadClearanceFt: 14,
        maxTruckSize: 'dump_truck',
        parkingNotes: 'Standard residential access assumed (fallback).'
      };
    } finally {
      this.isProcessing = false;
    }
  }
}
