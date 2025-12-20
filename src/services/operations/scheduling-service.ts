import { StorageService } from '../storage';
import { Booking, DailyRoute, AvailabilitySlot } from '@/types';

/**
 * Scheduling Service
 * Manages job scheduling, daily routes, and availability for calendar/Gantt views.
 */
export class SchedulingService {
  private routeStorage = new StorageService('operations/routes');
  private availabilityStorage = new StorageService('operations/availability');

  // Generate calendar data for a given month
  getMonthSchedule(year: number, month: number): CalendarDay[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push({
        date: new Date(d),
        jobs: [],
        isToday: this.isSameDay(d, new Date()),
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      });
    }

    return days;
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // ===== Route Management =====

  addRoute(route: Omit<DailyRoute, 'id' | 'createdAt'>): DailyRoute {
    const newRoute: DailyRoute = {
      ...route,
      id: `route-${Date.now()}`,
      createdAt: new Date()
    };
    this.routeStorage.save(newRoute.id, newRoute);
    return newRoute;
  }

  getRouteForDate(date: Date): DailyRoute | null {
    const routes = this.routeStorage.list<DailyRoute>();
    return routes.find(r => this.isSameDay(new Date(r.date), date)) || null;
  }

  // ===== Gantt Chart Data =====

  getGanttData(bookings: Booking[]): GanttTask[] {
    return bookings.map(b => ({
      id: b.id,
      name: b.notes || 'Scheduled Job',
      start: new Date(b.serviceDate),
      end: new Date(new Date(b.serviceDate).getTime() + 4 * 60 * 60 * 1000), // 4-hour default
      status: b.status,
      customerId: b.customerId
    }));
  }

  // ===== Availability =====

  setAvailability(slot: Omit<AvailabilitySlot, 'id'>): AvailabilitySlot {
    const newSlot: AvailabilitySlot = {
      ...slot,
      id: `slot-${Date.now()}`
    };
    this.availabilityStorage.save(newSlot.id, newSlot);
    return newSlot;
  }

  getAvailability(date: Date): AvailabilitySlot[] {
    const slots = this.availabilityStorage.list<AvailabilitySlot>();
    return slots.filter(s => this.isSameDay(new Date(s.date), date));
  }
}

// ===== Types =====

export interface CalendarDay {
  date: Date;
  jobs: Booking[];
  isToday: boolean;
  isWeekend: boolean;
}

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  status: Booking['status'];
  customerId: string;
}

// Singleton
let instance: SchedulingService | null = null;
export function getSchedulingService(): SchedulingService {
  if (!instance) {
    instance = new SchedulingService();
  }
  return instance;
}
