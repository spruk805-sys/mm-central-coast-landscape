import { NextResponse } from 'next/server';
import { getCustomerService } from '@/services/crm/customer-service';

/**
 * API: /api/crm/customers
 * GET - List all customers
 * POST - Add new customer
 */
export async function GET() {
  const service = getCustomerService();
  const customers = service.listCustomers();
  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  const service = getCustomerService();
  const body = await request.json();
  
  const newCustomer = service.addCustomer({
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address,
    lat: body.lat,
    lng: body.lng
  });

  return NextResponse.json({ success: true, customer: newCustomer });
}
