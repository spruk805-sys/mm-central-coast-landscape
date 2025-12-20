import { NextRequest, NextResponse } from 'next/server';
import { getAccountingManager } from '@/services/accounting/manager';

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    const accounting = getAccountingManager();
    const report = accounting.getCostAccounting().getHistory().find(r => r.jobId === jobId);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Connect to QBO and create invoice
    const qbo = accounting.getQuickBooks();
    await qbo.connect();
    
    const invoiceId = await qbo.createInvoice({
      customerName: `Customer for Job ${jobId}`, // In real app, fetch from CRM
      items: [
        { name: 'Landscaping Services', amount: report.revenue, quantity: 1 }
      ],
      total: report.revenue
    });

    return NextResponse.json({ success: true, invoiceId });
  } catch (error) {
    console.error('[Accounting API] Sync Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
