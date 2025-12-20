'use client';

import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import styles from './crm.module.css';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
}

interface Booking {
  id: string;
  customerId: string;
  serviceDate: Date;
  timeSlot: string;
  status: string;
  notes?: string;
}

export default function CRMView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerHistory, setCustomerHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/crm/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error('Error fetching customers', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerHistory = async (customerId: string) => {
    try {
      const res = await fetch(`/api/crm/bookings?customerId=${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerHistory(data.bookings);
      }
    } catch (err) {
      console.error('Error fetching history', err);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerHistory(customer.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'confirmed': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading CRM...</div>;
  }

  return (
    <div className={styles.crmContainer}>
      {!selectedCustomer ? (
        <>
          <div className={styles.crmHeader}>
            <h2>Customer Directory</h2>
            <span className={styles.badge}>{customers.length} Clients</span>
          </div>
          <div className={styles.customerGrid}>
            {customers.map(customer => (
              <div 
                key={customer.id} 
                className={styles.customerCard}
                onClick={() => handleSelectCustomer(customer)}
              >
                <div className={styles.customerIcon}>
                  <User size={20} />
                </div>
                <div className={styles.customerInfo}>
                  <h3>{customer.name}</h3>
                  <p>{customer.email}</p>
                  {customer.phone && (
                    <span className={styles.phone}>
                      <Phone size={12} /> {customer.phone}
                    </span>
                  )}
                </div>
                <ChevronRight size={20} className={styles.chevron} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className={styles.backBtn} onClick={() => setSelectedCustomer(null)}>
            <ArrowLeft size={18} /> Back to Directory
          </button>
          <div className={styles.customerDetail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailIcon}><User size={28} /></div>
              <div>
                <h2>{selectedCustomer.name}</h2>
                <p>{selectedCustomer.email}</p>
              </div>
            </div>
            {selectedCustomer.address && (
              <div className={styles.detailAddress}>
                <MapPin size={16} /> {selectedCustomer.address}
              </div>
            )}
          </div>

          <div className={styles.historySection}>
            <h3><Calendar size={18} /> Job History</h3>
            {customerHistory.length === 0 ? (
              <p className={styles.noHistory}>No job history found.</p>
            ) : (
              <div className={styles.historyList}>
                {customerHistory.map(booking => (
                  <div key={booking.id} className={styles.historyItem}>
                    <div 
                      className={styles.statusDot}
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    />
                    <div className={styles.historyInfo}>
                      <span className={styles.historyDate}>
                        {new Date(booking.serviceDate).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </span>
                      <span className={styles.historyNotes}>{booking.notes || 'Service performed'}</span>
                    </div>
                    <span 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(booking.status) + '20', color: getStatusColor(booking.status) }}
                    >
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
