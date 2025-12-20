import { NextResponse } from 'next/server';
import { getAccountingManager } from '@/services/accounting/manager';

export async function GET() {
  try {
    const accounting = getAccountingManager().getCostAccounting();
    const reports = accounting.getHistory();
    
    return NextResponse.json({ reports });
  } catch (_) {
    return NextResponse.json({ error: 'Failed to fetch accounting history' }, { status: 500 });
  }
}
