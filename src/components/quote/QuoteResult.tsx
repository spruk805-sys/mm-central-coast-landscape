"use client";

import styles from "./QuoteResult.module.css";
import type { QuoteResult as QuoteResultType, QuoteInput } from "@/types";

interface QuoteResultProps {
  result: QuoteResultType | null;
  isCalculating: boolean;
  propertyData: Partial<QuoteInput>;
  onStartOver: () => void;
  onBook: () => void;
}

export default function QuoteResult({ 
  result, 
  isCalculating, 
  propertyData,
  onStartOver, 
  onBook 
}: QuoteResultProps) {
  if (isCalculating) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingAnimation}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingIcon}>🌿</div>
        </div>
        <h2 className={styles.loadingTitle}>Calculating Your Quote</h2>
        <p className={styles.loadingText}>
          Analyzing property data and optimizing pricing...
        </p>
        <div className={styles.loadingSteps}>
          <div className={`${styles.loadingStep} ${styles.active}`}>
            <span className={styles.stepCheck}>✓</span>
            Property measurements
          </div>
          <div className={`${styles.loadingStep} ${styles.active}`}>
            <span className={styles.stepCheck}>✓</span>
            Service requirements
          </div>
          <div className={styles.loadingStep}>
            <span className={styles.stepSpinner}></span>
            Quote optimization
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={styles.error}>
        <span className={styles.errorIcon}>⚠️</span>
        <h2>Unable to Generate Quote</h2>
        <p>Something went wrong. Please try again.</p>
        <button onClick={onStartOver} className="btn btn-primary">
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className={styles.quoteResult}>
      {/* Success Header */}
      <div className={styles.successHeader}>
        <div className={styles.successIcon}>✅</div>
        <h2 className={styles.successTitle}>Your Quote is Ready!</h2>
        <p className={styles.successSubtitle}>
          Based on your property at {propertyData.address}
        </p>
      </div>

      {/* Main Quote Card */}
      <div className={styles.quoteCard}>
        <div className={styles.quoteTotal}>
          <span className={styles.totalLabel}>Estimated Total</span>
          <span className={styles.totalAmount}>
            ${result.estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className={styles.totalFrequency}>
            {propertyData.frequency === 'one-time' ? 'one-time service' : `per ${propertyData.frequency?.replace('-', ' ')} visit`}
          </span>
        </div>

        <div className={styles.confidenceBadge}>
          <span className={styles.confidenceIcon}>🎯</span>
          <span className={styles.confidenceText}>
            {Math.round(result.confidenceScore * 100)}% Confidence Score
          </span>
        </div>
      </div>

      {/* Breakdown */}
      <div className={styles.breakdown}>
        <h3 className={styles.breakdownTitle}>
          <span className={styles.breakdownIcon}>📋</span>
          Quote Breakdown
        </h3>
        <div className={styles.breakdownList}>
          {result.breakdown.map((item, index) => (
            <div 
              key={index} 
              className={`${styles.breakdownItem} ${item.subtotal < 0 ? styles.discount : ''}`}
            >
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.serviceName}</span>
                <span className={styles.itemDetails}>
                  {item.unit === 'discount' 
                    ? `${Math.abs(item.rate)}% savings`
                    : item.unit === 'flat' 
                      ? 'Flat rate'
                      : `${item.quantity.toLocaleString()} ${item.unit} × $${item.rate}`
                  }
                </span>
              </div>
              <span className={styles.itemAmount}>
                {item.subtotal < 0 ? '−' : ''}${Math.abs(item.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.breakdownTotal}>
          <span>Total</span>
          <span>${result.estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Property Summary */}
      <div className={styles.propertySummary}>
        <h4 className={styles.summaryTitle}>Property Details</h4>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryIcon}>📐</span>
            <span className={styles.summaryValue}>{propertyData.totalSqft?.toLocaleString()} sq ft</span>
            <span className={styles.summaryLabel}>Total Area</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryIcon}>🌿</span>
            <span className={styles.summaryValue}>{propertyData.lawnSqft?.toLocaleString()} sq ft</span>
            <span className={styles.summaryLabel}>Lawn Area</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryIcon}>🌳</span>
            <span className={styles.summaryValue}>{propertyData.treeCount}</span>
            <span className={styles.summaryLabel}>Trees</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryIcon}>🌲</span>
            <span className={styles.summaryValue}>{propertyData.bushCount}</span>
            <span className={styles.summaryLabel}>Bushes</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {result.notes.length > 0 && (
        <div className={styles.notes}>
          <h4 className={styles.notesTitle}>
            <span className={styles.notesIcon}>💡</span>
            Important Notes
          </h4>
          <ul className={styles.notesList}>
            {result.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button onClick={onBook} className="btn btn-primary btn-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Schedule Service
        </button>
        <button onClick={onStartOver} className="btn btn-secondary">
          Get Another Quote
        </button>
      </div>

      {/* Contact */}
      <div className={styles.contact}>
        <p>Have questions about this quote?</p>
        <div className={styles.contactActions}>
          <a href="tel:8052452313" className={styles.contactLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Call (805) 245-2313
          </a>
          <a href="mailto:mmedina3@outlook.com" className={styles.contactLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email Us
          </a>
        </div>
      </div>
    </div>
  );
}
