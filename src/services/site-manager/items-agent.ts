import { 
  Agent, 
  DetectedItem, 
  ServiceType 
} from './types';
import { quickClassify } from '../llm-client';

export class ItemsAgent implements Agent {
  public name = 'items-agent';
  private isRunning = false;

  private dumpKeywords = [
    'trash', 'junk', 'debris', 'mattress', 'sofa', 'couch', 'furniture',
    'appliance', 'box', 'cardboard', 'metal', 'wood', 'construction',
    'rubble', 'pile', 'bag', 'waste', 'recycling', 'refrigerator', 'washer',
    'dryer', 'tv', 'electronics', 'carpet', 'tire', 'branches', 'leaves'
  ];

  private landscapingKeywords = [
    'tree', 'bush', 'shrub', 'lawn', 'grass', 'flower', 'garden', 
    'patio', 'deck', 'pool', 'fence', 'path', 'walkway', 'driveway',
    'irrigation', 'sprinkler', 'mulch', 'rock', 'hedge'
  ];

  async start(): Promise<void> {
    this.isRunning = true;
    console.log(`[${this.name}] Started`);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log(`[${this.name}] Stopped`);
  }

  getStatus(): { healthy: boolean; details: Record<string, unknown> } {
    return {
      healthy: this.isRunning,
      details: {
        keywordsLoaded: this.dumpKeywords.length + this.landscapingKeywords.length
      }
    };
  }

  /**
   * Analyze text or labels to detect items and classify them by service.
   * This replaces loose keyword matching in other components.
   * Future versions can call an LLM here for ambiguity resolution.
   */
  public detectItemsFromText(text: string): DetectedItem[] {
    const items: DetectedItem[] = [];
    const lowerText = text.toLowerCase();
    
    // Check Dump Keywords
    this.dumpKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        items.push({
          id: `item-${Math.random().toString(36).substr(2, 9)}`,
          label: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          confidence: 0.85,
          service: 'dump'
        });
      }
    });

    // Check Landscaping Keywords
    this.landscapingKeywords.forEach(keyword => {
      // Avoid duplicates if a keyword overlaps (unlikely with this set but good practice)
      // also strictly check if we haven't found this item yet in this text chunk? 
      // For now, simpler is better: if mentioned, it exists.
      if (lowerText.includes(keyword)) {
        items.push({
          id: `item-${Math.random().toString(36).substr(2, 9)}`,
          label: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          confidence: 0.9,
          service: 'landscaping'
        });
      }
    });

    return items;
  }

  /**
   * Classify a single label into a service type.
   * Uses keywords first for speed, then falls back to LLM.
   */
  public async classifyItem(label: string): Promise<ServiceType> {
    const lower = label.toLowerCase();
    
    // 1. Fast Keyword Match
    if (this.dumpKeywords.some(k => lower.includes(k))) return 'dump';
    if (this.landscapingKeywords.some(k => lower.includes(k))) return 'landscaping';

    // 2. LLM Classification (User Requested Feature)
    console.log(`[ItemsAgent] Keyword match failed for "${label}". Asking LLM...`);
    const llmResult = await quickClassify(label, ['dump', 'landscaping']);
    if (llmResult === 'dump' || llmResult === 'landscaping') {
       console.log(`[ItemsAgent] LLM classified "${label}" as ${llmResult}`);
       return llmResult;
    }

    return 'landscaping'; // Default fallback
  }
}
