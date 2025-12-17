'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/site-manager/status');
        if (!res.ok) throw new Error('Failed to fetch status');
        const json = await res.json();
        setData(json);
        setError(null);
        setLastUpdate(new Date());
      } catch (err) {
        setError('Connection lost');
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val || 0);
  };

  if (!data && !error) return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
      <div className="animate-pulse">Connecting to Operations Center...</div>
    </div>
  );

  const metrics = data?.metrics || {};
  const statusColor = data?.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400';
  const statusBg = data?.status === 'healthy' ? 'bg-emerald-500/10' : 'bg-amber-500/10';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Operations Intelligence</h1>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className={`inline-block w-2 h-2 rounded-full ${data?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
            System Status: <span className={statusColor}>{data?.status?.toUpperCase()}</span>
          </div>
        </div>
        <div className="text-right text-sm text-slate-500">
          <div>Last Updated: {lastUpdate.toLocaleTimeString()}</div>
          <div>Uptime: {Math.floor((data?.uptime || 0) / 60)}m {Math.floor((data?.uptime || 0) % 60)}s</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card 
            title="Total Cost" 
            value={formatCurrency(metrics.totalCost)} 
            icon={<DollarIcon />}
            trend="+0.00" // Placeholder
          />
          <Card 
            title="Total Requests" 
            value={formatNumber(metrics.totalRequests)} 
            icon={<ActivityIcon />}
            sub={`Success Rate: ${Math.round((metrics.successfulRequests / (metrics.totalRequests || 1)) * 100)}%`}
          />
          <Card 
            title="Active Workers" 
            value={data?.activeWorkers || 0} 
            icon={<CpuIcon />}
            sub={`Queue Depth: ${data?.queueDepth || 0}`}
            highlight={data?.activeWorkers > 0}
          />
           <Card 
            title="Tokens Processed" 
            value={formatNumber(metrics.totalTokens)} 
            icon={<HashIcon />}
          />
        </div>

        {/* Provider Stats */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">AI Provider Performance</h2>
            <div className="text-xs text-slate-500">Real-time Metrics</div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-sm border-b border-slate-800">
                    <th className="pb-3 font-medium">Provider</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Requests</th>
                    <th className="pb-3 font-medium text-right">Avg Latency</th>
                    <th className="pb-3 font-medium text-right">Errors</th>
                    <th className="pb-3 font-medium text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {metrics.byProvider && Object.entries(metrics.byProvider).map(([provider, stats]: [string, any]) => (
                    <tr key={provider} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 font-medium text-white capitalize flex items-center gap-2">
                        {provider}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          data?.providers?.[provider]?.status === 'healthy' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {data?.providers?.[provider]?.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="py-4 text-right text-slate-300">{stats.requests}</td>
                      <td className="py-4 text-right text-slate-300">
                        {Math.round(stats.avgLatency)}ms
                        <div className="w-16 h-1 bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${Math.min(100, (stats.avgLatency / 5000) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4 text-right text-red-300">{stats.errors}</td>
                      <td className="py-4 text-right text-emerald-300 font-medium">
                        {formatCurrency(stats.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Activity Log (Mocked for now, future Phase) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Hourly Trends</h3>
              <div className="space-y-4">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Request Volume</span>
                    <span className="text-white">{metrics.lastHour?.requests || 0}</span>
                 </div>
                 <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                 </div>
                 
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Error Rate</span>
                    <span className="text-red-400">{metrics.lastHour?.errors || 0}</span>
                 </div>
                 <div className="w-full bg-slate-800 rounded-full h-2">
                     <div className="bg-red-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Operations Log</h3>
              <div className="space-y-3 text-sm font-mono max-h-40 overflow-y-auto">
                 <div className="text-emerald-400">[{new Date().toLocaleTimeString()}] System online</div>
                 {data?.activeWorkers > 0 && (
                   <div className="text-blue-400">[{new Date().toLocaleTimeString()}] Processing {data.activeWorkers} active analysis requests...</div>
                 )}
                 {data?.queueDepth > 0 && (
                   <div className="text-amber-400">[{new Date().toLocaleTimeString()}] Queued {data.queueDepth} requests for optimization</div>
                 )}
                 {/* This would be populated by a real event log in the future */}
              </div>
           </div>
        </div>

      </main>
    </div>
  );
}

function Card({ title, value, icon, sub, highlight, trend }: any) {
  return (
    <div className={`bg-slate-900 p-6 rounded-xl border ${highlight ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-slate-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="text-slate-400 text-sm font-medium">{title}</div>
        <div className="text-slate-500">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {(sub || trend) && (
        <div className="text-xs text-slate-500 flex justify-between">
          <span>{sub}</span>
          {trend && <span className="text-emerald-400">{trend}</span>}
        </div>
      )}
    </div>
  );
}

// Icons
const DollarIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);

const ActivityIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

const CpuIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
);

const HashIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>
);
