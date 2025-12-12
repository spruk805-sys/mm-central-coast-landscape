// Type definitions for the MM Central Coast Landscape application

// ===== Core Types =====

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  createdAt: Date;
}

export interface Property {
  id: string;
  customerId: string;
  address: string;
  lat: number;
  lng: number;
  boundaryPolygon?: GeoJSONPolygon;
  totalSqft?: number;
  lawnSqft?: number;
  bedsSqft?: number;
  treeCount?: number;
  bushCount?: number;
  hasPool?: boolean;
  hasFence?: boolean;
  obstacles?: Obstacle[];
  createdAt: Date;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Obstacle {
  type: 'pool' | 'patio' | 'shed' | 'garden_bed' | 'rock' | 'other';
  description?: string;
  area?: number;
}

// ===== Service Types =====

export type RateType = 'sqft' | 'unit' | 'hour' | 'flat';

export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  baseRate: number;
  rateType: RateType;
  isActive: boolean;
}

export interface QuoteLineItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unit: string;
  rate: number;
  subtotal: number;
}

export interface Quote {
  id: string;
  propertyId: string;
  customerId: string;
  totalAmount: number;
  breakdown: QuoteLineItem[];
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil?: Date;
  createdAt: Date;
}

// ===== Quote Calculator Types =====

export interface QuoteInput {
  address: string;
  lat: number;
  lng: number;
  totalSqft: number;
  lawnSqft: number;
  bedsSqft: number;
  treeCount: number;
  bushCount: number;
  hasPool: boolean;
  hasFence: boolean;
  services: string[];
  frequency?: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
}

export interface QuoteResult {
  estimatedTotal: number;
  breakdown: QuoteLineItem[];
  confidenceScore: number;
  notes: string[];
}

// ===== Booking Types =====

export type TimeSlot = 'morning' | 'afternoon';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  customerId: string;
  propertyId: string;
  quoteId?: string;
  serviceDate: Date;
  timeSlot: TimeSlot;
  status: BookingStatus;
  assignedCrew?: string[];
  notes?: string;
  createdAt: Date;
}

export interface AvailabilitySlot {
  id: string;
  date: Date;
  timeSlot: TimeSlot;
  maxJobs: number;
  bookedCount: number;
  isAvailable: boolean;
}

// ===== Employee Types =====

export type EmployeeRole = 'admin' | 'crew_lead' | 'crew_member';

export interface Employee {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: EmployeeRole;
  isActive: boolean;
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  bookingId: string;
  checkInTime?: Date;
  checkInLat?: number;
  checkInLng?: number;
  checkOutTime?: Date;
  checkOutLat?: number;
  checkOutLng?: number;
  durationMinutes?: number;
  notes?: string;
  createdAt: Date;
}

// ===== Route Types =====

export interface DailyRoute {
  id: string;
  date: Date;
  employeeId: string;
  routeOrder: string[]; // Array of booking IDs
  totalDistanceMiles?: number;
  estimatedDurationMinutes?: number;
  optimizationScore?: number;
  createdAt: Date;
}

export interface RouteStop {
  bookingId: string;
  property: Property;
  customer: Customer;
  estimatedArrival?: Date;
  estimatedDuration?: number;
  order: number;
}

// ===== Invoice/ML Training Types =====

export interface HistoricalInvoice {
  id: string;
  address?: string;
  lat?: number;
  lng?: number;
  propertySqft?: number;
  servicesPerformed?: ServicePerformed[];
  totalBilled: number;
  hoursSpent?: number;
  notes?: string;
  invoiceImageUrl?: string;
  ocrData?: OCRResult;
  createdAt: Date;
}

export interface ServicePerformed {
  serviceName: string;
  quantity?: number;
  amount: number;
}

export interface OCRResult {
  rawText: string;
  extractedData: {
    address?: string;
    date?: string;
    services?: string[];
    total?: number;
  };
  confidence: number;
}

// ===== Map Types =====

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface DrawnPolygon {
  path: Coordinates[];
  area: number; // in square feet
  type?: ZoneType;
  label?: string;
}

export type ZoneType = 'lawn' | 'garden' | 'pool' | 'tree_cluster' | 'other';

export interface PropertyZone {
  id: string;
  type: ZoneType;
  path: Coordinates[];
  area: number;
}

// ===== API Response Types =====

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
