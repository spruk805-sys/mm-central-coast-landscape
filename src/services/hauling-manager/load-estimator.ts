/**
 * Load Estimator Agent
 * Calculates volume, weight, crew needs, and vehicle requirements
 */

import { HaulingAgent, DetectedItem, LoadEstimate } from './types';

// Vehicle capacities
const VEHICLE_CAPACITY = {
  pickup: { volume: 50, weight: 1500 }, // cubic feet, lbs
  pickup_trailer: { volume: 150, weight: 4000 },
  dump_trailer: { volume: 300, weight: 8000 },
  box_truck: { volume: 500, weight: 6000 },
  roll_off: { volume: 600, weight: 10000 },
};

// Equipment by weight threshold
const EQUIPMENT_THRESHOLDS = {
  dolly: 50, // lbs - need for items over this
  furniture_straps: 100,
  appliance_dolly: 150,
  pallet_jack: 500,
};

export class LoadEstimatorAgent implements HaulingAgent {
  name = 'LoadEstimator';
  
  private stats = {
    estimatesGenerated: 0,
    avgLoadSize: 0,
  };
  
  async start(): Promise<void> {
    console.log('[LoadEstimator] Starting load estimation agent');
  }
  
  async stop(): Promise<void> {
    console.log('[LoadEstimator] Stopping...');
  }
  
  getStatus() {
    return {
      healthy: true,
      details: {
        estimatesGenerated: this.stats.estimatesGenerated,
        avgLoadSize: this.stats.avgLoadSize,
      },
    };
  }
  
  /**
   * Generate load estimate from items
   */
  estimateLoad(items: DetectedItem[]): LoadEstimate {
    const totalWeight = items.reduce((sum, item) => 
      sum + (item.estimatedWeight * item.quantity), 0);
    
    const totalVolume = items.reduce((sum, item) => 
      sum + (item.estimatedVolume * item.quantity), 0);
    
    const vehicleRequired = this.selectVehicle(totalVolume, totalWeight);
    const capacity = VEHICLE_CAPACITY[vehicleRequired];
    const truckCapacityUsed = Math.min(100, Math.round((totalVolume / capacity.volume) * 100));
    
    const crewSize = this.calculateCrewSize(items, totalWeight);
    const estimatedLoadTime = this.calculateLoadTime(items, crewSize);
    const equipmentNeeded = this.determineEquipment(items);
    
    this.stats.estimatesGenerated++;
    this.stats.avgLoadSize = 
      (this.stats.avgLoadSize * (this.stats.estimatesGenerated - 1) + totalVolume) / 
      this.stats.estimatesGenerated;
    
    return {
      totalWeight,
      totalVolume,
      truckCapacityUsed,
      vehicleRequired,
      crewSize,
      estimatedLoadTime,
      equipmentNeeded,
    };
  }
  
  /**
   * Select appropriate vehicle
   */
  private selectVehicle(volume: number, weight: number): LoadEstimate['vehicleRequired'] {
    for (const [vehicle, capacity] of Object.entries(VEHICLE_CAPACITY)) {
      if (volume <= capacity.volume && weight <= capacity.weight) {
        return vehicle as LoadEstimate['vehicleRequired'];
      }
    }
    return 'roll_off'; // Largest option
  }
  
  /**
   * Calculate crew size needed
   */
  private calculateCrewSize(items: DetectedItem[], totalWeight: number): number {
    // Base on heaviest single item and total weight
    const heaviestItem = Math.max(...items.map(i => i.estimatedWeight));
    
    if (heaviestItem > 300 || totalWeight > 2000) return 3;
    if (heaviestItem > 150 || totalWeight > 1000) return 2;
    return 1;
  }
  
  /**
   * Calculate estimated load time in minutes
   */
  private calculateLoadTime(items: DetectedItem[], crewSize: number): number {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    
    // Base: 5 min per item, adjusted by crew
    const baseTime = totalItems * 5;
    const adjustedTime = Math.ceil(baseTime / crewSize);
    
    // Add time for heavy/bulky items
    const heavyItems = items.filter(i => i.estimatedWeight > 100).length;
    const extraTime = heavyItems * 10;
    
    // Minimum 15 minutes, max 4 hours
    return Math.min(240, Math.max(15, adjustedTime + extraTime));
  }
  
  /**
   * Determine equipment needed
   */
  private determineEquipment(items: DetectedItem[]): string[] {
    const equipment = new Set<string>(['Gloves', 'PPE']);
    
    const maxWeight = Math.max(...items.map(i => i.estimatedWeight));
    
    if (maxWeight > EQUIPMENT_THRESHOLDS.dolly) {
      equipment.add('Hand dolly');
    }
    if (maxWeight > EQUIPMENT_THRESHOLDS.furniture_straps) {
      equipment.add('Furniture straps');
    }
    if (maxWeight > EQUIPMENT_THRESHOLDS.appliance_dolly) {
      equipment.add('Appliance dolly');
    }
    
    // Category-specific equipment
    const hasYardDebris = items.some(i => i.category === 'yard_debris');
    if (hasYardDebris) {
      equipment.add('Wheelbarrow');
      equipment.add('Rake');
    }
    
    const hasHazardous = items.some(i => i.hazardous);
    if (hasHazardous) {
      equipment.add('Hazmat containers');
      equipment.add('Safety goggles');
    }
    
    return Array.from(equipment);
  }
}
