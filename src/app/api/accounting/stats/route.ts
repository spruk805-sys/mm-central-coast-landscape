import { NextResponse } from 'next/server';
import { getAccountingManager } from '@/services/accounting/manager';

export async function GET() {
  const accounting = getAccountingManager().getCostAccounting();
  const reports = accounting.getHistory();
  
  const revenueTotal = reports.reduce((sum, r) => sum + r.revenue, 0);
  const costTotal = reports.reduce((sum, r) => sum + r.cost, 0);
  const profitTotal = reports.reduce((sum, r) => sum + r.grossProfit, 0);
  const avgMargin = reports.length > 0 ? reports.reduce((sum, r) => sum + r.marginPercent, 0) / reports.length : 0;

  const stats = {
    avgMargin: Math.round(avgMargin * 10) / 10,
    revenueTotal,
    costTotal,
    profitTotal,
    trends: reports.slice(-6).map(r => ({
      month: r.jobId.split('-')[1], // Mock month from ID for now
      revenue: r.revenue,
      margin: r.marginPercent
    }))
  };

  return NextResponse.json({ stats });
}
