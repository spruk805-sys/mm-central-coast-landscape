import { StorageService } from '../storage';
import { Customer, Property, Booking, Quote } from '@/types';

/**
 * Customer Service (CRM)
 * Manages customer records, properties, and job history with persistence.
 */
export class CustomerService {
  private customerStorage = new StorageService('crm/customers');
  private propertyStorage = new StorageService('crm/properties');
  private bookingStorage = new StorageService('crm/bookings');
  private quoteStorage = new StorageService('crm/quotes');

  constructor() {
    this.seedMockData();
  }

  private seedMockData(): void {
    const customers = this.customerStorage.list<Customer>();
    if (customers.length === 0) {
      // Seed initial customers
      const mockCustomers: Customer[] = [
        {
          id: 'cust-001',
          name: 'Robert Sterling',
          email: 'rsterling@email.com',
          phone: '(805) 555-1234',
          address: '1234 Oak Valley Rd, Santa Ynez, CA 93460',
          lat: 34.6041,
          lng: -120.0601,
          createdAt: new Date('2024-01-15')
        },
        {
          id: 'cust-002',
          name: 'Maria Gonzalez',
          email: 'maria.g@email.com',
          phone: '(805) 555-5678',
          address: '567 Vineyard Lane, Solvang, CA 93463',
          lat: 34.5958,
          lng: -120.1376,
          createdAt: new Date('2024-03-22')
        },
        {
          id: 'cust-003',
          name: 'James & Linda Chen',
          email: 'chen.family@email.com',
          phone: '(805) 555-9012',
          address: '890 Estate Dr, Los Olivos, CA 93441',
          lat: 34.6696,
          lng: -120.1149,
          createdAt: new Date('2023-11-08')
        }
      ];
      mockCustomers.forEach(c => this.customerStorage.save(c.id, c));

      // Seed bookings (job history)
      const mockBookings: Booking[] = [
        {
          id: 'book-001',
          customerId: 'cust-001',
          propertyId: 'prop-001',
          serviceDate: new Date('2024-11-15'),
          timeSlot: 'morning',
          status: 'completed',
          notes: 'Full estate cleanup - 3 crew members',
          createdAt: new Date('2024-11-10')
        },
        {
          id: 'book-002',
          customerId: 'cust-001',
          propertyId: 'prop-001',
          serviceDate: new Date('2024-12-05'),
          timeSlot: 'afternoon',
          status: 'completed',
          notes: 'Monthly maintenance - hedges and lawns',
          createdAt: new Date('2024-12-01')
        },
        {
          id: 'book-003',
          customerId: 'cust-002',
          propertyId: 'prop-002',
          serviceDate: new Date('2024-12-20'),
          timeSlot: 'morning',
          status: 'pending',
          notes: 'Pre-holiday cleanup',
          createdAt: new Date('2024-12-10')
        },
        {
          id: 'book-004',
          customerId: 'cust-003',
          propertyId: 'prop-003',
          serviceDate: new Date('2025-01-05'),
          timeSlot: 'morning',
          status: 'confirmed',
          notes: 'New Year estate prep',
          createdAt: new Date('2024-12-15')
        }
      ];
      mockBookings.forEach(b => this.bookingStorage.save(b.id, b));
    }
  }

  // ===== Customer CRUD =====

  addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      createdAt: new Date()
    };
    this.customerStorage.save(newCustomer.id, newCustomer);
    return newCustomer;
  }

  getCustomer(id: string): Customer | null {
    return this.customerStorage.get<Customer>(id);
  }

  listCustomers(): Customer[] {
    return this.customerStorage.list<Customer>();
  }

  // ===== Job History =====

  getCustomerHistory(customerId: string): Booking[] {
    return this.bookingStorage.list<Booking>().filter(b => b.customerId === customerId);
  }

  getUpcomingJobs(): Booking[] {
    const now = new Date();
    return this.bookingStorage.list<Booking>()
      .filter(b => new Date(b.serviceDate) >= now && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime());
  }

  getPastJobs(): Booking[] {
    const now = new Date();
    return this.bookingStorage.list<Booking>()
      .filter(b => new Date(b.serviceDate) < now || b.status === 'completed')
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
  }

  // ===== Booking Management =====

  addBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Booking {
    const newBooking: Booking = {
      ...booking,
      id: `book-${Date.now()}`,
      createdAt: new Date()
    };
    this.bookingStorage.save(newBooking.id, newBooking);
    return newBooking;
  }

  updateBookingStatus(bookingId: string, status: Booking['status']): Booking | null {
    const booking = this.bookingStorage.get<Booking>(bookingId);
    if (!booking) return null;
    booking.status = status;
    this.bookingStorage.save(bookingId, booking);
    return booking;
  }

  getAllBookings(): Booking[] {
    return this.bookingStorage.list<Booking>();
  }
}

// Singleton
let instance: CustomerService | null = null;
export function getCustomerService(): CustomerService {
  if (!instance) {
    instance = new CustomerService();
  }
  return instance;
}
