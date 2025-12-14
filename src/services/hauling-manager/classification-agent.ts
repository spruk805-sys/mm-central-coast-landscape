/**
 * Classification Agent
 * Identifies and categorizes items from images
 */

import { HaulingAgent, DetectedItem, ItemCategory, DisposalMethod } from './types';
import { v4 as uuidv4 } from 'uuid';

// Item classification rules
const CATEGORY_KEYWORDS: Record<ItemCategory, string[]> = {
  furniture: ['couch', 'sofa', 'chair', 'table', 'desk', 'bed', 'mattress', 'dresser', 'cabinet', 'shelf'],
  appliance: ['refrigerator', 'fridge', 'washer', 'dryer', 'dishwasher', 'stove', 'oven', 'microwave', 'ac unit'],
  electronics: ['tv', 'computer', 'monitor', 'printer', 'laptop', 'phone', 'stereo', 'speaker'],
  yard_debris: ['branches', 'leaves', 'grass', 'shrub', 'tree', 'stump', 'mulch', 'dirt', 'soil'],
  construction: ['lumber', 'drywall', 'concrete', 'brick', 'tile', 'roofing', 'insulation', 'plywood'],
  household: ['boxes', 'bags', 'clothes', 'toys', 'books', 'dishes', 'pots', 'pans', 'decor'],
  hazardous: ['paint', 'chemical', 'oil', 'battery', 'propane', 'pesticide', 'fluorescent'],
  recyclable: ['cardboard', 'paper', 'plastic', 'metal', 'aluminum', 'glass', 'cans'],
  other: [],
};

// Donation eligibility by category
const DONATABLE_CATEGORIES: ItemCategory[] = ['furniture', 'appliance', 'electronics', 'household'];

// Recyclable categories
const RECYCLABLE_CATEGORIES: ItemCategory[] = ['electronics', 'recyclable', 'appliance'];

export class ClassificationAgent implements HaulingAgent {
  name = 'Classification';
  
  private stats = {
    itemsClassified: 0,
    byCategory: {} as Record<ItemCategory, number>,
  };
  
  async start(): Promise<void> {
    console.log('[Classification] Starting item classification agent');
  }
  
  async stop(): Promise<void> {
    console.log('[Classification] Stopping...');
  }
  
  getStatus() {
    return {
      healthy: true,
      details: {
        itemsClassified: this.stats.itemsClassified,
        byCategory: this.stats.byCategory,
      },
    };
  }
  
  /**
   * Classify raw AI output into structured items
   */
  classifyItems(rawItems: any[]): DetectedItem[] {
    return rawItems.map(item => this.classifyItem(item));
  }
  
  /**
   * Classify a single item
   */
  classifyItem(rawItem: any): DetectedItem {
    const name = (rawItem.name || 'Unknown item').toLowerCase();
    const category = this.detectCategory(name);
    
    this.stats.itemsClassified++;
    this.stats.byCategory[category] = (this.stats.byCategory[category] || 0) + 1;
    
    const weight = this.parseWeight(rawItem.estimatedWeight);
    const volume = this.estimateVolume(rawItem.estimatedSize, category);
    
    return {
      id: uuidv4(),
      name: rawItem.name || 'Unknown item',
      category,
      quantity: rawItem.quantity || 1,
      estimatedWeight: weight,
      estimatedVolume: volume,
      disposalMethod: this.determineDisposal(category, rawItem.disposalType),
      confidence: rawItem.confidence || 0.7,
      donatable: this.isDonatable(category, rawItem),
      recyclable: RECYCLABLE_CATEGORIES.includes(category),
      hazardous: category === 'hazardous',
    };
  }
  
  /**
   * Detect category from item name
   */
  private detectCategory(name: string): ItemCategory {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => name.includes(kw))) {
        return category as ItemCategory;
      }
    }
    return 'other';
  }
  
  /**
   * Parse weight from string
   */
  private parseWeight(weightStr: string | number): number {
    if (typeof weightStr === 'number') return weightStr;
    if (!weightStr) return 20; // Default 20 lbs
    
    const match = weightStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 20;
  }
  
  /**
   * Estimate volume from size description
   */
  private estimateVolume(sizeStr: string, category: ItemCategory): number {
    // Default volumes by category (cubic feet)
    const defaults: Record<ItemCategory, number> = {
      furniture: 30,
      appliance: 25,
      electronics: 5,
      yard_debris: 10,
      construction: 15,
      household: 3,
      hazardous: 2,
      recyclable: 5,
      other: 5,
    };
    
    if (!sizeStr) return defaults[category];
    
    // Try to parse dimensions like "4x3x2"
    const dimMatch = sizeStr.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/i);
    if (dimMatch) {
      const [, l, w, h] = dimMatch.map(Number);
      return (l * w * h) / 1728; // Convert cubic inches to cubic feet
    }
    
    return defaults[category];
  }
  
  /**
   * Determine disposal method
   */
  private determineDisposal(category: ItemCategory, suggested?: string): DisposalMethod {
    if (suggested === 'donate' && DONATABLE_CATEGORIES.includes(category)) {
      return 'donate';
    }
    if (suggested === 'recycle' && RECYCLABLE_CATEGORIES.includes(category)) {
      return 'recycle';
    }
    if (category === 'hazardous') {
      return 'hazmat';
    }
    return 'dump';
  }
  
  /**
   * Check if item is donatable
   */
  private isDonatable(category: ItemCategory, item: any): boolean {
    if (!DONATABLE_CATEGORIES.includes(category)) return false;
    // Don't donate if broken/damaged
    const name = (item.name || '').toLowerCase();
    if (name.includes('broken') || name.includes('damaged') || name.includes('old')) {
      return false;
    }
    return true;
  }
}
