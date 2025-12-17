import { DetectedItem, ServiceType } from './site-manager/types';

export class ItemizationEngine {
  
  /**
   * Filter and categorize items based on the requested service type.
   * This ensures we don't bill a landscaping client for "trash" logic 
   * or a dump client for "tree pruning" unless explicitly requested.
   */
  public limitToService(items: DetectedItem[], service: ServiceType): DetectedItem[] {
    console.log(`[ItemizationEngine] Filtering ${items.length} items for service: ${service}`);
    
    return items.filter(item => {
      // If the item itself is tagged with a service, use that
      if (item.service && item.service !== service) {
        return false;
      }

      // Otherwise, fallback to keyword matching (if service tag is missing or ambiguous)
      const label = item.label.toLowerCase();
      
      if (service === 'landscaping') {
        // Keep landscaping features
        return this.isLandscapingFeature(label);
      } else {
        // Keep dump/junk features
        return this.isDumpFeature(label);
      }
    });
  }

  private isLandscapingFeature(label: string): boolean {
    const keywords = [
      'tree', 'bush', 'shrub', 'lawn', 'grass', 'flower', 'garden', 
      'patio', 'deck', 'pool', 'fence', 'path', 'walkway', 'driveway',
      'irrigation', 'sprinkler', 'mulch', 'rock'
    ];
    return keywords.some(k => label.includes(k));
  }

  private isDumpFeature(label: string): boolean {
    const keywords = [
      'trash', 'junk', 'debris', 'mattress', 'sofa', 'couch', 'furniture',
      'appliance', 'box', 'cardboard', 'metal', 'wood', 'construction',
      'rubble', 'pile', 'bag', 'waste', 'recycling'
    ];
    return keywords.some(k => label.includes(k));
  }

  /**
   * Determine the service type based on the item label.
   */
  public determineServiceType(label: string): ServiceType {
    const lowerLabel = label.toLowerCase();
    if (this.isDumpFeature(lowerLabel)) return 'dump';
    if (this.isLandscapingFeature(lowerLabel)) return 'landscaping';
    return 'landscaping'; // default fallback
  }
}
