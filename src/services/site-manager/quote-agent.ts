import { Agent, DetectedItem } from './types';
import { MaterialsLibraryService } from '../estimating/materials-library';

export interface QuoteItem {
  label: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface DetailedQuote {
  jobId: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export class QuoteAgent implements Agent {
  name = 'Quote';
  private materialsLibrary: MaterialsLibraryService;

  constructor(materialsLibrary: MaterialsLibraryService) {
    this.materialsLibrary = materialsLibrary;
  }

  async start(): Promise<void> {
    console.log('[QuoteAgent] Starting...');
  }

  async stop(): Promise<void> {
    console.log('[QuoteAgent] Stopping...');
  }

  getStatus() {
    return { healthy: true, details: { materialsCount: this.materialsLibrary.getAllMaterials().length } };
  }

  /**
   * Generate a quote based on detected items from the Video/Image AI
   */
  async generateQuote(detectedItems: DetectedItem[]): Promise<DetailedQuote> {
    console.log('[QuoteAgent] Generating quote from AI detections...');
    
    // In a real scenario, this would use Gemini 1.5 Pro to map labels to materials and estimate quantities.
    // For this MVP, we map detected labels to our materials library.
    
    const quoteItems: QuoteItem[] = detectedItems.map(item => {
      // Very simple mapping for demo
      const material = this.findBestMatch(item.label);
      const quantity = 1; // Default for now, should be estimated by AI
      
      return {
        label: item.label,
        quantity,
        unit: material?.unit || 'ea',
        unitPrice: material?.unitCost || 0,
        totalPrice: (material?.unitCost || 0) * quantity
      };
    });

    const subtotal = quoteItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.0775; // SB Tax

    return {
      jobId: `QUOTE-${Math.random().toString(36).substring(7).toUpperCase()}`,
      items: quoteItems,
      subtotal,
      tax,
      total: subtotal + tax
    };
  }

  private findBestMatch(label: string) {
    const materials = this.materialsLibrary.getAllMaterials();
    return materials.find(m => 
      label.toLowerCase().includes(m.name.toLowerCase()) || 
      m.name.toLowerCase().includes(label.toLowerCase())
    );
  }
}
