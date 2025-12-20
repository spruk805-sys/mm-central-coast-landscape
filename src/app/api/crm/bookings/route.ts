import { NextResponse } from 'next/server';
import { getCustomerService } from '@/services/crm/customer-service';

/**
 * API: /api/crm/bookings
 * GET - List all bookings (with optional filters)
 * POST - Create new booking
 */
export async function GET(request: Request) {
  const service = getCustomerService();
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  const filter = searchParams.get('filter'); // 'upcoming' | 'past' | 'all'

  let bookings;
  if (customerId) {
    bookings = service.getCustomerHistory(customerId);
  } else if (filter === 'upcoming') {
    bookings = service.getUpcomingJobs();
  } else if (filter === 'past') {
    bookings = service.getPastJobs();
  } else {
    bookings = service.getAllBookings();
  }

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const service = getCustomerService();
  const body = await request.json();

  const newBooking = service.addBooking({
    customerId: body.customerId,
    propertyId: body.propertyId,
    serviceDate: new Date(body.serviceDate),
    timeSlot: body.timeSlot,
    status: body.status || 'pending',
    notes: body.notes
  });

  return NextResponse.json({ success: true, booking: newBooking });
}
