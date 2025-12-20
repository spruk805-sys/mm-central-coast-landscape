import { NextResponse } from 'next/server';
import { getOperationsManager } from '@/services/operations/manager';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');

  if (!employeeId) {
    return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
  }

  const timeClock = getOperationsManager().getTimeClockService();
  const activeShift = timeClock.getActiveShift(employeeId);

  return NextResponse.json({ activeShift: activeShift || null });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, action, location } = body;

    if (!employeeId || !action || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const timeClock = getOperationsManager().getTimeClockService();

    if (action === 'clockIn') {
      const result = await timeClock.clockIn(employeeId, location);
      return NextResponse.json(result);
    } else if (action === 'clockOut') {
      const result = await timeClock.clockOut(employeeId, location);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
