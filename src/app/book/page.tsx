"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const timeSlots = [
  { id: 'morning', label: 'Morning', time: '8:00 AM - 12:00 PM' },
  { id: 'afternoon', label: 'Afternoon', time: '1:00 PM - 5:00 PM' },
];

// Generate next 14 days of availability
const generateAvailability = () => {
  const days = [];
  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip Sundays
    if (date.getDay() === 0) continue;
    
    days.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      morning: Math.random() > 0.3,
      afternoon: Math.random() > 0.4,
    });
  }
  
  return days;
};

export default function BookPage() {
  const [availability] = useState(generateAvailability);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedDay = availability.find(d => d.dateStr === selectedDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isSubmitted) {
    return (
      <div className={styles.bookPage}>
        <section className={styles.hero}>
          <div className="container">
            <span className={styles.heroTag}>Booking Confirmed</span>
            <h1 className={styles.heroTitle}>Thank You!</h1>
            <p className={styles.heroSubtitle}>
              Your service appointment has been scheduled.
            </p>
          </div>
        </section>
        <section className={`section ${styles.successSection}`}>
          <div className="container">
            <div className={styles.successCard}>
              <div className={styles.successIcon}>✅</div>
              <h2>Booking Confirmed</h2>
              <div className={styles.bookingDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>📅</span>
                  <div>
                    <span className={styles.detailLabel}>Date</span>
                    <span className={styles.detailValue}>
                      {selectedDay?.month} {selectedDay?.dayNum}
                    </span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>🕐</span>
                  <div>
                    <span className={styles.detailLabel}>Time</span>
                    <span className={styles.detailValue}>
                      {timeSlots.find(s => s.id === selectedSlot)?.time}
                    </span>
                  </div>
                </div>
              </div>
              <p className={styles.confirmationText}>
                We&apos;ve sent a confirmation email to {formData.email}. 
                A team member will contact you before your appointment.
              </p>
              <Link href="/" className="btn btn-primary">
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.bookPage}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.heroTag}>Schedule Service</span>
          <h1 className={styles.heroTitle}>Book Your Appointment</h1>
          <p className={styles.heroSubtitle}>
            Select a date and time that works best for you
          </p>
        </div>
      </section>

      {/* Booking Section */}
      <section className={`section-lg ${styles.bookingSection}`}>
        <div className="container">
          <div className={styles.bookingGrid}>
            {/* Calendar */}
            <div className={styles.calendarCard}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIcon}>📅</span>
                Select a Date
              </h2>
              <div className={styles.calendar}>
                {availability.map((day) => (
                  <button
                    key={day.dateStr}
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setSelectedSlot(null);
                    }}
                    disabled={!day.morning && !day.afternoon}
                    className={`${styles.dateBtn} ${
                      selectedDate === day.dateStr ? styles.selected : ''
                    } ${!day.morning && !day.afternoon ? styles.unavailable : ''}`}
                  >
                    <span className={styles.dayName}>{day.dayName}</span>
                    <span className={styles.dayNum}>{day.dayNum}</span>
                    <span className={styles.month}>{day.month}</span>
                  </button>
                ))}
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div className={styles.timeSlots}>
                  <h3 className={styles.slotsTitle}>Available Times</h3>
                  <div className={styles.slotsGrid}>
                    {timeSlots.map((slot) => {
                      const isAvailable = selectedDay?.[slot.id as 'morning' | 'afternoon'];
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot.id)}
                          disabled={!isAvailable}
                          className={`${styles.slotBtn} ${
                            selectedSlot === slot.id ? styles.selected : ''
                          } ${!isAvailable ? styles.unavailable : ''}`}
                        >
                          <span className={styles.slotLabel}>{slot.label}</span>
                          <span className={styles.slotTime}>{slot.time}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Booking Form */}
            <div className={styles.formCard}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIcon}>📝</span>
                Your Information
              </h2>
              
              {selectedDate && selectedSlot ? (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.selectedInfo}>
                    <div className={styles.selectedItem}>
                      <span className={styles.selectedIcon}>📅</span>
                      <span>{selectedDay?.dayName}, {selectedDay?.month} {selectedDay?.dayNum}</span>
                    </div>
                    <div className={styles.selectedItem}>
                      <span className={styles.selectedIcon}>🕐</span>
                      <span>{timeSlots.find(s => s.id === selectedSlot)?.time}</span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={styles.input}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={styles.input}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.label}>Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className={styles.input}
                      placeholder="(805) 555-1234"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="notes" className={styles.label}>Additional Notes</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className={styles.textarea}
                      placeholder="Any special instructions or requests..."
                      rows={3}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className={styles.spinner}></span>
                        Booking...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </form>
              ) : (
                <div className={styles.placeholder}>
                  <div className={styles.placeholderIcon}>👈</div>
                  <p>Select a date and time to continue</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
