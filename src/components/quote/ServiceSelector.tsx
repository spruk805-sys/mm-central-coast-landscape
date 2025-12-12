"use client";

import { useState } from "react";
import styles from "./ServiceSelector.module.css";
import type { QuoteInput } from "@/types";
import Image from "next/image";

interface ServiceSelectorProps {
  selectedServices: string[];
  frequency?: QuoteInput['frequency'];
  onSubmit: (services: string[], frequency: QuoteInput['frequency']) => void;
  onBack: () => void;
}
const services = [
  {
    id: 'lawn-maintenance',
    icon: '/images/lawn-service.png',
    name: 'Lawn Maintenance',
    description: 'Regular mowing, edging, and blowing for a pristine yard.',
    popular: true,
    imgIcon: true,
  },
  {
    id: 'tree-trimming',
    icon: '/images/tree-service.png',
    name: 'Tree Trimming',
    description: 'Expert pruning to promote health and aesthetics.',
    popular: true,
    imgIcon: true,
  },
  {
    id: 'bush-trimming',
    icon: '/images/bush-service.png',
    name: 'Bush & Shrub Care',
    description: 'Hedge trimming and shrub maintenance.',
    popular: false,
    imgIcon: true,
  },
  {
    id: 'sprinkler-repair',
    icon: '/images/irrigation-service.png',
    name: 'Irrigation Services',
    description: 'Diagnosis, repair, and system management.',
    popular: false,
    imgIcon: true,
  },
  {
    id: 'garden-design',
    icon: '/images/garden-service.png',
    name: 'Garden & Planting',
    description: 'Design, seasonal color, and bed care.',
    popular: true,
    imgIcon: true,
  },
  {
    id: 'hardscaping',
    icon: '/images/hardscape-service.png',
    name: 'Hardscaping',
    description: 'Patios, walkways, and retaining walls.',
    popular: true,
    imgIcon: true,
  },
  {
    id: 'sod-installation',
    icon: '/images/sod-service.png',
    name: 'Sod Installation',
    description: 'Instant lawn transformation with premium sod.',
    popular: false,
    imgIcon: true,
  },
  {
    id: 'fence-repair',
    icon: '/images/fence-service.png',
    name: 'Fence Services',
    description: 'Installation and repair of fences and gates.',
    popular: false,
    imgIcon: true,
  },
  {
    id: 'cleanup',
    icon: '/images/cleanup-service.png',
    name: 'Yard Cleanup',
    description: 'Leaf removal, debris clearing, and deep cleaning.',
    popular: false,
    imgIcon: true,
  },
  {
    id: 'trashcaddy',
    icon: '/images/trash-bin.png',
    name: 'TrashCaddy',
    description: 'Trash cans to curb & back.',
    popular: false,
    imgIcon: true,
  },
  {
    id: 'trashcaddy-return',
    icon: '/images/trash-bin.png',
    name: 'TrashCaddy + Return',
    description: 'Full service: to curb & return.',
    popular: true,
    imgIcon: true,
  },
];

const frequencies = [
  { id: 'one-time', label: 'One-Time Service', discount: null },
  { id: 'monthly', label: 'Monthly', discount: '5% off' },
  { id: 'bi-weekly', label: 'Bi-Weekly', discount: '10% off' },
  { id: 'weekly', label: 'Weekly', discount: '15% off' },
];

export default function ServiceSelector({ 
  selectedServices: initialServices, 
  frequency: initialFrequency,
  onSubmit, 
  onBack 
}: ServiceSelectorProps) {
  const [selected, setSelected] = useState<string[]>(initialServices);
  const [frequency, setFrequency] = useState<QuoteInput['frequency']>(initialFrequency || 'one-time');

  const toggleService = (serviceId: string) => {
    setSelected(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;
    onSubmit(selected, frequency);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div>
          <h2 className={styles.title}>Select Your Services</h2>
          <p className={styles.subtitle}>
            Choose the services you need for your property
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Services Grid */}
        <div className={styles.servicesSection}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>✨</span>
            Available Services
            <span className={styles.selectedCount}>
              {selected.length} selected
            </span>
          </h3>
          <div className={styles.servicesGrid}>
            {services.map((service) => (
              <label
                key={service.id}
                className={`${styles.serviceCard} ${
                  selected.includes(service.id) ? styles.selected : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(service.id)}
                  onChange={() => toggleService(service.id)}
                  className={styles.serviceInput}
                />
                <div className={styles.serviceContent}>
                  <div className={styles.serviceIcon}>
                    {service.imgIcon ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <Image 
                          src={service.icon} 
                          alt={service.name}
                          fill
                          sizes="64px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      service.icon
                    )}
                  </div>
                  <div className={styles.serviceInfo}>
                    <span className={styles.serviceName}>
                      {service.name}
                      {service.popular && (
                        <span className={styles.popularBadge}>Popular</span>
                      )}
                    </span>
                    <span className={styles.serviceDescription}>
                      {service.description}
                    </span>
                  </div>
                </div>
                <div className={styles.serviceCheck}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Frequency Selection */}
        <div className={styles.frequencySection}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📅</span>
            Service Frequency
          </h3>
          <p className={styles.frequencyHint}>
            Save more with recurring service plans
          </p>
          <div className={styles.frequencyGrid}>
            {frequencies.map((freq) => (
              <label
                key={freq.id}
                className={`${styles.frequencyCard} ${
                  frequency === freq.id ? styles.active : ''
                }`}
              >
                <input
                  type="radio"
                  name="frequency"
                  value={freq.id}
                  checked={frequency === freq.id}
                  onChange={() => setFrequency(freq.id as QuoteInput['frequency'])}
                  className={styles.frequencyInput}
                />
                <span className={styles.frequencyLabel}>{freq.label}</span>
                {freq.discount && (
                  <span className={styles.discountBadge}>{freq.discount}</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Quick Select */}
        <div className={styles.quickSelect}>
          <button
            type="button"
            className={styles.quickBtn}
            onClick={() => setSelected(services.filter(s => s.popular).map(s => s.id))}
          >
            Select Popular
          </button>
          <button
            type="button"
            className={styles.quickBtn}
            onClick={() => setSelected(services.map(s => s.id))}
          >
            Select All
          </button>
          <button
            type="button"
            className={styles.quickBtn}
            onClick={() => setSelected([])}
          >
            Clear All
          </button>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={selected.length === 0}
          >
            Get My Quote
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          {selected.length === 0 && (
            <p className={styles.warning}>Please select at least one service</p>
          )}
        </div>
      </form>
    </div>
  );
}
