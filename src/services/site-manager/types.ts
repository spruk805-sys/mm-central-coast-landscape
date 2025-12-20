/**
 * Site Manager Types
 * Shared types for the Site Manager Agent system
 */

// AI Model Providers
export type AIProvider = 'gemini' | 'openai' | 'claude' | 'local' | 'consensus';

// Request priority levels
export type Priority = 'urgent' | 'high' | 'standard' | 'low';

// Health status
export type HealthStatus = 'healthy' | 'degraded' | 'down';

// Model configuration
export interface ModelConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  maxTokens: number;
  costPer1kTokens: number;
  timeout: number;
  enabled: boolean;
}

// Request for analysis
export interface AnalysisRequest {
  id: string;
  images: { mime: string; data: string; label: string }[];
  address: string;
  lat: number;
  lng: number;
  parcelData?: Record<string, unknown>;
  priority: Priority;
  retryOnLowConfidence: boolean;
  createdAt: Date;
}

// Analysis result
export interface AnalysisResult {
  requestId: string;
  provider: AIProvider;
  model: string;
  analysis: Record<string, unknown>;
  confidence: number;
  latencyMs: number;
  tokenUsage?: { input: number; output: number };
  cost?: number;
}

export type ServiceType = 'landscaping' | 'dump';

export interface DetectedItem {
  id: string;
  label: string;
  confidence: number;
  box?: [number, number, number, number]; // [x, y, w, h]
  mask?: string; // polygon string
  service: ServiceType;
}

export interface VideoAnalysisResult {
    videoId: string;
    items: DetectedItem[];
    summary: string;
    processingTime: number;
    error?: string;
}

export interface ProviderMetrics {
  requests: number;
  errors: number;
  avgLatency: number;
  lastError?: string;
  lastErrorAt?: Date;
  totalTokens?: number;
  totalCost?: number;
}

// Metrics for monitoring
export interface Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  rateLimitHits: number;
  lastHour: {
    requests: number;
    errors: number;
    avgLatency: number;
  };
  byProvider: Record<AIProvider, ProviderMetrics>;
  totalTokens?: number;
  totalCost?: number;
}

// Site Manager configuration
export interface SiteManagerConfig {
  models: ModelConfig[];
  maxConcurrent: number;
  qualityThreshold: number;
  alertWebhook?: string;
  enableMetrics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// System status
export interface SystemStatus {
  healthy: boolean;
  status: HealthStatus;
  activeWorkers: number;
  queueDepth: number;
  providers: Record<AIProvider, {
    status: HealthStatus;
    lastResponse?: Date;
    errorRate: number;
  }>;
  metrics: Metrics;
  uptime: number;
  startedAt: Date;
  videoStatus?: { healthy: boolean; details: Record<string, unknown> };
  upscaleStatus?: { healthy: boolean; details: Record<string, unknown> };
  quoteStatus?: { healthy: boolean; details: Record<string, unknown> };
  gpsStatus?: { healthy: boolean; details: Record<string, unknown> };
  agents: Array<{ name: string; healthy: boolean; details: Record<string, unknown> }>;
  personnelAlerts?: Array<{ employeeId: string; type: string; message: string; severity: string; timestamp: Date }>;
  activeActivity?: Array<{ employeeId: string; activity: string; confidence: number; startTime: Date }>;
  jobHistory?: Array<{ id: string; employeeId: string; siteId: string; date: string; activities: Array<{ task: string; durationMinutes: number }> }>;
}

// Agent interface - all agents implement this
export interface Agent {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): { healthy: boolean; details: Record<string, unknown> };
}

// Event types for the event bus
export type EventType = 
  | 'request.received'
  | 'request.completed'
  | 'request.failed'
  | 'provider.error'
  | 'provider.rateLimit'
  | 'quality.low'
  | 'alert.triggered';

export interface Event {
  type: EventType;
  timestamp: Date;
  data: unknown;
}

export type EventHandler = (event: Event) => void | Promise<void>;
