/**
 * Mock Data Provider for Dashboard Testing
 */

export const MOCK_SYSTEM_STATUS = {
  healthy: true,
  status: 'healthy',
  activeWorkers: 3,
  queueDepth: 5,
  upscaleStatus: { healthy: true, details: { activeRequests: 0 } },
  videoStatus: { healthy: true, details: { activeRequests: 1 } },
  providers: {
    gemini: { status: 'healthy', errorRate: 0 },
    openai: { status: 'healthy', errorRate: 0.05 },
    claude: { status: 'healthy', errorRate: 0 },
    local: { status: 'healthy', errorRate: 0 },
    consensus: { status: 'healthy', errorRate: 0.01 },
  },
  metrics: {
    totalRequests: 1250,
    totalCost: 12.45,
    byProvider: {
      gemini: { requests: 800, errors: 0, totalCost: 4.50 },
      openai: { requests: 450, errors: 22, totalCost: 7.95 },
    },
  },
  uptime: 3600000,
  startedAt: new Date(Date.now() - 3600000),
};

export const MOCK_FIN_STATS = {
  revenueTotal: 125400,
  avgMargin: 35.4,
  avgLaborBurden: 45.0,
  trends: [
    { month: 'Oct', revenue: 38000 },
    { month: 'Nov', revenue: 42000 },
    { month: 'Dec', revenue: 45400 },
  ],
};

export const MOCK_SITES = [
  { id: 'SITE-001', name: 'Santa Ynez Estate' },
  { id: 'SITE-002', name: 'Solvang Commercial' },
  { id: 'SITE-003', name: 'Los Olivos Vineyard' },
];

export const MOCK_OPS_DATA = {
  activeShift: {
    jobSiteId: 'SITE-001',
    startTime: new Date(Date.now() - 45 * 60000).toISOString(),
  },
};
