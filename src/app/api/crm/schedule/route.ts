import { NextResponse } from 'next/server';
import { getSchedulingService } from '@/services/operations/scheduling-service';
import { getCustomerService } from '@/services/crm/customer-service';

/**
 * API: /api/crm/schedule
 * GET - Get calendar or Gantt data
 */
export async function GET(request: Request) {
  const schedulingService = getSchedulingService();
  const customerService = getCustomerService();
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view'); // 'calendar' | 'gantt'
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const month = parseInt(searchParams.get('month') || new Date().getMonth().toString());

  if (view === 'gantt') {
    const bookings = customerService.getAllBookings();
    const ganttData = schedulingService.getGanttData(bookings);
    return NextResponse.json({ tasks: ganttData });
  }

  // Default: Calendar view
  const calendar = schedulingService.getMonthSchedule(year, month);
  const bookings = customerService.getAllBookings();

  // Merge bookings into calendar days
  const enrichedCalendar = calendar.map(day => ({
    ...day,
    jobs: bookings.filter(b => {
      const bookingDate = new Date(b.serviceDate);
      return bookingDate.getFullYear() === day.date.getFullYear() &&
             bookingDate.getMonth() === day.date.getMonth() &&
             bookingDate.getDate() === day.date.getDate();
    })
  }));

  return NextResponse.json({ calendar: enrichedCalendar });
}
