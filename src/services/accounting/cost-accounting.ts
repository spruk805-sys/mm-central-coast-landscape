import { StorageService } from '../storage';

export interface CostBreakdown {
  labor: number;
  disposal: number;
  fuel: number;
  materials: number;
  overhead: number;
  totalCost: number;
}

export interface JobRevenue {
  jobId: string;
  quotedAmount: number;
  upsellAmount: number;
  totalRevenue: number;
}

export interface ProfitReport {
  jobId: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPercent: number;
  breakdown: CostBreakdown;
}

export class CostAccountingService {
  private storage = new StorageService('accounting/reports');
  // Configurable Rates
  private laborRatePerHour = 45; // Blended rate (wage + burden)
  private fuelSurcharge = 15; // Flat per job for MVP
  private overheadPercent = 0.15; // 15% of revenue allocated to overhead

  constructor() {
    this.seedDummyData();
  }

  private seedDummyData() {
    if (this.storage.list().length === 0) {
      console.log('[Accounting] Seeding demo ledger data...');
      const dummyReports: ProfitReport[] = [
        {
          jobId: 'JOB-9821',
          revenue: 12500,
          cost: 8200,
          grossProfit: 4300,
          marginPercent: 34.4,
          breakdown: { labor: 4500, disposal: 800, fuel: 15, materials: 1800, overhead: 1085, totalCost: 8200 }
        },
        {
          jobId: 'JOB-9822',
          revenue: 8400,
          cost: 4100,
          grossProfit: 4300,
          marginPercent: 51.2,
          breakdown: { labor: 1800, disposal: 400, fuel: 15, materials: 600, overhead: 1285, totalCost: 4100 }
        },
        {
            jobId: 'JOB-9823',
            revenue: 25000,
            cost: 18000,
            grossProfit: 7000,
            marginPercent: 28.0,
            breakdown: { labor: 12000, disposal: 1500, fuel: 15, materials: 1500, overhead: 2985, totalCost: 18000 }
          }
      ];
      dummyReports.forEach(r => this.storage.save(r.jobId, r));
    }
  }

  /**
   * Calculate P&L for a completed job
   */
  calculateJobProfit(
    jobId: string, 
    revenue: JobRevenue, 
    laborHours: number, 
    disposalFees: number,
    materialCosts: number = 0
  ): ProfitReport {
    
    // 1. Calculate Costs
    const laborCost = laborHours * this.laborRatePerHour;
    const overheadCost = revenue.totalRevenue * this.overheadPercent;
    
    const breakdown: CostBreakdown = {
      labor: laborCost,
      disposal: disposalFees,
      fuel: this.fuelSurcharge,
      materials: materialCosts,
      overhead: overheadCost,
      totalCost: laborCost + disposalFees + this.fuelSurcharge + materialCosts + overheadCost
    };

    // 2. Calculate Profit
    const grossProfit = revenue.totalRevenue - breakdown.totalCost;
    const marginPercent = parseFloat(((grossProfit / revenue.totalRevenue) * 100).toFixed(1));

    // 3. Generate Report
    const report: ProfitReport = {
      jobId,
      revenue: revenue.totalRevenue,
      cost: breakdown.totalCost,
      grossProfit,
      marginPercent,
      breakdown
    };

    this.saveReport(report);
    return report;
  }

  private saveReport(report: ProfitReport) {
    this.storage.save(report.jobId, report);
    const status = report.marginPercent > 30 ? 'HEALTHY' : 'LOW MARGIN';
    console.log(`[Accounting] Job ${report.jobId}: ${report.marginPercent}% Margin (${status}) - Profit: $${report.grossProfit}`);
  }

  getHistory(): ProfitReport[] {
    return this.storage.list<ProfitReport>();
  }

  updateRates(newLaborRate?: number, newFuelSurcharge?: number) {
    if (newLaborRate) this.laborRatePerHour = newLaborRate;
    if (newFuelSurcharge) this.fuelSurcharge = newFuelSurcharge;
  }
}
