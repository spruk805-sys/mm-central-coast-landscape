/**
 * Hauling Manager Types
 * Shared types for the Hauling Service Manager system
 */

// Item categories
export type ItemCategory = 
  | 'furniture'
  | 'appliance'
  | 'electronics'
  | 'yard_debris'
  | 'construction'
  | 'household'
  | 'hazardous'
  | 'recyclable'
  | 'other';

// Disposal methods
export type DisposalMethod = 'dump' | 'donate' | 'recycle' | 'hazmat';

// Individual item detected
export interface DetectedItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  estimatedWeight: number; // lbs
  estimatedVolume: number; // cubic feet
  dimensions?: { l: number; w: number; h: number };
  disposalMethod: DisposalMethod;
  confidence: number;
  donatable: boolean;
  recyclable: boolean;
  hazardous: boolean;
}

// Load calculation
export interface LoadEstimate {
  totalWeight: number; // lbs
  totalVolume: number; // cubic feet
  truckCapacityUsed: number; // percentage
  vehicleRequired: 'pickup' | 'pickup_trailer' | 'dump_trailer' | 'box_truck' | 'roll_off';
  crewSize: number;
  estimatedLoadTime: number; // minutes
  equipmentNeeded: string[];
}

// Pricing structure
export interface PricingBreakdown {
  laborCost: number;
  disposalFees: number;
  vehicleCost: number;
  equipmentCost: number;
  fuelEstimate: number;
  subtotal: number;
  tax: number;
  total: number;
  lowEstimate: number;
  highEstimate: number;
}

// Quote structure
export interface HaulingQuote {
  id: string;
  items: DetectedItem[];
  loadEstimate: LoadEstimate;
  pricing: PricingBreakdown;
  disposalPlan: {
    dumpItems: DetectedItem[];
    donateItems: DetectedItem[];
    recycleItems: DetectedItem[];
    hazmatItems: DetectedItem[];
  };
  notes: string[];
  confidence: number;
  createdAt: Date;
  validUntil: Date;
}

// Analysis request
export interface HaulingAnalysisRequest {
  id: string;
  images: { mime: string; data: string }[];
  description?: string;
  location?: { lat: number; lng: number };
  createdAt: Date;
}

// Agent interface
export interface HaulingAgent {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): { healthy: boolean; details: any };
}

// System status
export interface HaulingSystemStatus {
  healthy: boolean;
  agents: Record<string, { healthy: boolean; details: any }>;
  metrics: {
    totalQuotes: number;
    avgConfidence: number;
    itemsProcessed: number;
  };
  uptime: number;
}

// Pricing rates
export interface PricingRates {
  laborPerHour: number;
  dumpFeePerTon: number;
  pickupRate: number;
  trailerRate: number;
  boxTruckRate: number;
  rollOffRate: number;
  minimumCharge: number;
}
