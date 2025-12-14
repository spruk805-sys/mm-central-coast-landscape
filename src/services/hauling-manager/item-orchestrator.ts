/**
 * Item Orchestrator Agent
 * Routes image analysis to AI models for item detection
 */

import { HaulingAgent, HaulingAnalysisRequest } from './types';

export class ItemOrchestratorAgent implements HaulingAgent {
  name = 'ItemOrchestrator';
  
  private stats = {
    analysesCompleted: 0,
    avgLatencyMs: 0,
  };
  
  async start(): Promise<void> {
    console.log('[ItemOrchestrator] Starting item orchestrator');
  }
  
  async stop(): Promise<void> {
    console.log('[ItemOrchestrator] Stopping...');
  }
  
  getStatus() {
    return {
      healthy: true,
      details: {
        analysesCompleted: this.stats.analysesCompleted,
        avgLatencyMs: this.stats.avgLatencyMs,
      },
    };
  }
  
  /**
   * Analyze images using Gemini
   */
  async analyzeImages(request: HaulingAnalysisRequest): Promise<any[]> {
    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
    if (!apiKey) throw new Error('Gemini API key not configured');
    
    const startTime = Date.now();
    
    const prompt = this.buildPrompt(request.description);
    
    const parts: any[] = [{ text: prompt }];
    
    for (const img of request.images) {
      parts.push({
        inline_data: {
          mime_type: img.mime,
          data: img.data,
        },
      });
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
        }),
      }
    );
    
    if (response.status === 429) throw new Error('Rate Limited');
    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error('Empty response from Gemini');
    
    const items = this.parseResponse(text);
    
    // Update stats
    const latency = Date.now() - startTime;
    this.stats.analysesCompleted++;
    this.stats.avgLatencyMs = 
      (this.stats.avgLatencyMs * (this.stats.analysesCompleted - 1) + latency) / 
      this.stats.analysesCompleted;
    
    console.log(`[ItemOrchestrator] Detected ${items.length} items in ${latency}ms`);
    
    return items;
  }
  
  /**
   * Build analysis prompt
   */
  private buildPrompt(description?: string): string {
    return `You are an expert junk removal specialist. Analyze these images of items to be hauled away.

${description ? `Customer notes: ${description}` : ''}

For each distinct item or pile, provide:
- name: Item name/description
- quantity: Count of similar items
- estimatedWeight: Weight in lbs (e.g., "50 lbs")
- estimatedSize: Dimensions or size description
- disposalType: "dump", "donate", or "recycle"
- confidence: Your confidence 0.0-1.0

Return ONLY valid JSON array:
[
  {"name": "string", "quantity": number, "estimatedWeight": "string", "estimatedSize": "string", "disposalType": "dump|donate|recycle", "confidence": number}
]`;
  }
  
  /**
   * Parse AI response
   */
  private parseResponse(text: string): any[] {
    try {
      const cleaned = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      console.error('[ItemOrchestrator] Failed to parse response');
      return [{
        name: 'Various items',
        quantity: 1,
        estimatedWeight: '50 lbs',
        estimatedSize: 'Medium',
        disposalType: 'dump',
        confidence: 0.3,
      }];
    }
  }
}
