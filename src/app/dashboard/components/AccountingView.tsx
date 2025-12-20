'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import styles from './AccountingView.module.css';

interface ProfitReport {
  jobId: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPercent: number;
  breakdown: {
    labor: number;
    disposal: number;
    fuel: number;
    materials: number;
    overhead: number;
    totalCost: number;
  };
}

export default function AccountingView() {
  const [reports, setReports] = useState<ProfitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting/history');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch {
      console.error('Failed to fetch accounting history');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToQBO = async (report: ProfitReport) => {
    setSyncingId(report.jobId);
    try {
      const res = await fetch('/api/accounting/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: report.jobId })
      });
      if (res.ok) {
        // Update local state or show success
        alert(`Job ${report.jobId} successfully synced to QuickBooks`);
      }
    } catch (error) {
      alert('Sync failed. Please check connection.');
    } finally {
      setSyncingId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  if (loading) return <div className={styles.loading}>Loading Ledger...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Financial Ledger</h2>
          <p className={styles.subtitle}>Real-time Job P&L and Cost Analysis</p>
        </div>
        <button onClick={fetchReports} className={styles.refreshBtn}>
          <RefreshCcw size={16} />
          Refresh
        </button>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Revenue</th>
              <th>Total Cost</th>
              <th>Profit</th>
              <th>Margin</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length > 0 ? reports.map((report) => (
              <tr key={report.jobId} className={styles.row}>
                <td className={styles.jobId}>{report.jobId}</td>
                <td className={styles.revenue}>{formatCurrency(report.revenue)}</td>
                <td className={styles.cost}>{formatCurrency(report.cost)}</td>
                <td className={styles.profit}>{formatCurrency(report.grossProfit)}</td>
                <td className={styles.margin}>
                  <div className={styles.marginBadge} style={{ 
                    backgroundColor: report.marginPercent > 35 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 113, 133, 0.1)',
                    color: report.marginPercent > 35 ? '#34d399' : '#fb7185'
                  }}>
                    {report.marginPercent}%
                  </div>
                </td>
                <td>
                  <span className={styles.status}>
                    {report.marginPercent > 30 ? (
                      <CheckCircle2 size={14} className={styles.healthyIcon} />
                    ) : (
                      <AlertCircle size={14} className={styles.warningIcon} />
                    )}
                    {report.marginPercent > 30 ? 'Healthy' : 'Low Margin'}
                  </span>
                </td>
                <td>
                  <button 
                    className={styles.syncBtn}
                    onClick={() => handleSyncToQBO(report)}
                    disabled={syncingId === report.jobId}
                  >
                    {syncingId === report.jobId ? (
                      <RefreshCcw size={14} className={styles.spin} />
                    ) : (
                      'Sync QBO'
                    )}
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className={styles.empty}>No completed jobs found in ledger.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
