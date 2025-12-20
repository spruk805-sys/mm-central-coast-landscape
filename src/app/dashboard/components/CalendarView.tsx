'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import styles from './calendar.module.css';

interface Booking {
  id: string;
  customerId: string;
  serviceDate: Date;
  timeSlot: string;
  status: string;
  notes?: string;
}

interface CalendarDay {
  date: Date;
  jobs: Booking[];
  isToday: boolean;
  isWeekend: boolean;
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchCalendar();
  }, [currentDate]);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/crm/schedule?view=calendar&year=${currentDate.getFullYear()}&month=${currentDate.getMonth()}`
      );
      if (res.ok) {
        const data = await res.json();
        // Parse dates
        const parsed = data.calendar.map((day: CalendarDay) => ({
          ...day,
          date: new Date(day.date),
          jobs: day.jobs.map((j: Booking) => ({
            ...j,
            serviceDate: new Date(j.serviceDate)
          }))
        }));
        setCalendarDays(parsed);
      }
    } catch (err) {
      console.error('Error fetching calendar', err);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'confirmed': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  // Calculate padding days for the first week
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <button onClick={prevMonth} className={styles.navBtn}><ChevronLeft size={20} /></button>
        <div className={styles.monthTitle}>
          <CalendarIcon size={18} />
          <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        </div>
        <button onClick={nextMonth} className={styles.navBtn}><ChevronRight size={20} /></button>
      </div>

      <div className={styles.weekdays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className={styles.weekday}>{day}</div>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading schedule...</div>
      ) : (
        <div className={styles.daysGrid}>
          {/* Padding for first week */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`pad-${i}`} className={styles.dayEmpty} />
          ))}
          
          {calendarDays.map((day, idx) => (
            <div 
              key={idx} 
              className={`${styles.dayCell} ${day.isToday ? styles.today : ''} ${day.isWeekend ? styles.weekend : ''}`}
            >
              <span className={styles.dayNumber}>{day.date.getDate()}</span>
              <div className={styles.jobsContainer}>
                {day.jobs.slice(0, 3).map((job, jIdx) => (
                  <div 
                    key={jIdx}
                    className={styles.jobDot}
                    style={{ backgroundColor: getStatusColor(job.status) }}
                    title={job.notes || 'Scheduled job'}
                  />
                ))}
                {day.jobs.length > 3 && (
                  <span className={styles.moreJobs}>+{day.jobs.length - 3}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
