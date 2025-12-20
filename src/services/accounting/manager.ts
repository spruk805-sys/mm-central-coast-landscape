import { QuickBooksConnector } from './quickbooks-connector';
import { CostAccountingService } from './cost-accounting';

class AccountingManager {
  private quickbooks: QuickBooksConnector;
  private costAccounting: CostAccountingService;

  constructor() {
    this.quickbooks = new QuickBooksConnector();
    this.costAccounting = new CostAccountingService();
  }

  getQuickBooks(): QuickBooksConnector {
    return this.quickbooks;
  }

  getCostAccounting(): CostAccountingService {
    return this.costAccounting;
  }
}

// Singleton instance
let instance: AccountingManager | null = null;

export function getAccountingManager(): AccountingManager {
  if (!instance) {
    instance = new AccountingManager();
  }
  return instance;
}
