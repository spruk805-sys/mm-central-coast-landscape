import { Agent } from './types';
import { analyzeText } from '../llm-client';

export interface Hazard {
  type: 'power_lines' | 'chemicals' | 'sharps' | 'unstable_ground' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: [number, number]; // x, y percentages
}

export interface SafetyAnalysisResult {
  hazards: Hazard[];
  requiredPPE: string[];
  warnings: string[];
  safeToProceed: boolean;
}

export class SafetyAgent implements Agent {
  name = 'Safety';
  private isProcessing = false;

  async start(): Promise<void> {
    console.log('[SafetyAgent] Starting...');
  }

  async stop(): Promise<void> {
    console.log('[SafetyAgent] Stopping...');
    this.isProcessing = false;
  }

  getStatus(): { healthy: boolean; details: any } {
    return {
      healthy: true,
      details: { isProcessing: this.isProcessing }
    };
  }

  /**
   * Analyze context for safety hazards using LLM
   */
  async analyzeSafety(context: string): Promise<SafetyAnalysisResult> {
    this.isProcessing = true;
    try {
      console.log(`[SafetyAgent] Analyzing safety context...`);
      
      const prompt = `Analyze these property notes for safety hazards: "${context}".
      Identify hazards like power lines, chemicals, sharps, steep slopes, dogs, etc.
      Recommend PPE.`;

      const schema = `{
        "hazards": [{ "type": "string", "severity": "low|medium|high", "description": "string" }],
        "requiredPPE": ["string"],
        "warnings": ["string"],
        "safeToProceed": boolean
      }`;

      const result = await analyzeText<SafetyAnalysisResult>(prompt, schema);
      
      if (result) {
        return {
            hazards: result.hazards || [],
            requiredPPE: result.requiredPPE || ['standard_gloves', 'boots'],
            warnings: result.warnings || [],
            safeToProceed: result.safeToProceed ?? true
        };
      }
      
      // Fallback
      return {
        hazards: [],
        requiredPPE: ['gloves', 'boots'],
        warnings: [],
        safeToProceed: true
      };
    } finally {
      this.isProcessing = false;
    }
  }
}
