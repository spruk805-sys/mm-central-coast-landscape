"use client";

import { useState } from "react";
import styles from "./PropertyDetails.module.css";
import type { QuoteInput } from "@/types";

interface PropertyDetailsProps {
  initialData: Partial<QuoteInput>;
  onSubmit: (details: Partial<QuoteInput>) => void;
  onBack: () => void;
}

export default function PropertyDetails({ initialData, onSubmit, onBack }: PropertyDetailsProps) {
  const [formData, setFormData] = useState({
    totalSqft: initialData.totalSqft || 0,
    lawnSqft: initialData.lawnSqft || 0,
    bedsSqft: initialData.bedsSqft || 0,
    treeCount: initialData.treeCount || 0,
    bushCount: initialData.bushCount || 0,
    hasPool: initialData.hasPool || false,
    hasFence: initialData.hasFence || false,
  });

  const handleChange = (field: keyof typeof formData, value: number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className={styles.propertyDetails}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div>
          <h2 className={styles.title}>Property Details</h2>
          <p className={styles.subtitle}>
            Help us understand your property better for an accurate quote
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Area Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📐</span>
            Property Areas
          </h3>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Total Property Area</label>
              <div className={styles.inputGroup}>
                <input
                  type="number"
                  value={formData.totalSqft}
                  onChange={(e) => handleChange('totalSqft', Number(e.target.value))}
                  className={styles.input}
                  min="0"
                />
                <span className={styles.inputSuffix}>sq ft</span>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Lawn Area</label>
              <div className={styles.inputGroup}>
                <input
                  type="number"
                  value={formData.lawnSqft}
                  onChange={(e) => handleChange('lawnSqft', Number(e.target.value))}
                  className={styles.input}
                  min="0"
                  max={formData.totalSqft}
                />
                <span className={styles.inputSuffix}>sq ft</span>
              </div>
              <span className={styles.hint}>
                {formData.totalSqft > 0 
                  ? `${Math.round((formData.lawnSqft / formData.totalSqft) * 100)}% of total`
                  : 'Grass/turf areas'
                }
              </span>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Garden Beds</label>
              <div className={styles.inputGroup}>
                <input
                  type="number"
                  value={formData.bedsSqft}
                  onChange={(e) => handleChange('bedsSqft', Number(e.target.value))}
                  className={styles.input}
                  min="0"
                  max={formData.totalSqft}
                />
                <span className={styles.inputSuffix}>sq ft</span>
              </div>
              <span className={styles.hint}>Flower beds, planters, mulched areas</span>
            </div>
          </div>
        </div>

        {/* Vegetation Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🌳</span>
            Trees & Shrubs
          </h3>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Number of Trees</label>
              <div className={styles.counterGroup}>
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => handleChange('treeCount', Math.max(0, formData.treeCount - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  value={formData.treeCount}
                  onChange={(e) => handleChange('treeCount', Number(e.target.value))}
                  className={styles.counterInput}
                  min="0"
                />
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => handleChange('treeCount', formData.treeCount + 1)}
                >
                  +
                </button>
              </div>
              <span className={styles.hint}>Trees requiring trimming/maintenance</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Number of Bushes/Shrubs</label>
              <div className={styles.counterGroup}>
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => handleChange('bushCount', Math.max(0, formData.bushCount - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  value={formData.bushCount}
                  onChange={(e) => handleChange('bushCount', Number(e.target.value))}
                  className={styles.counterInput}
                  min="0"
                />
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => handleChange('bushCount', formData.bushCount + 1)}
                >
                  +
                </button>
              </div>
              <span className={styles.hint}>Hedges, shrubs, ornamental bushes</span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🏡</span>
            Property Features
          </h3>
          <div className={styles.toggleGrid}>
            <label className={`${styles.toggleCard} ${formData.hasPool ? styles.active : ''}`}>
              <input
                type="checkbox"
                checked={formData.hasPool}
                onChange={(e) => handleChange('hasPool', e.target.checked)}
                className={styles.toggleInput}
              />
              <div className={styles.toggleContent}>
                <span className={styles.toggleIcon}>🏊</span>
                <span className={styles.toggleLabel}>Pool</span>
                <span className={styles.toggleHint}>Swimming pool on property</span>
              </div>
              <div className={styles.toggleCheck}>✓</div>
            </label>
            <label className={`${styles.toggleCard} ${formData.hasFence ? styles.active : ''}`}>
              <input
                type="checkbox"
                checked={formData.hasFence}
                onChange={(e) => handleChange('hasFence', e.target.checked)}
                className={styles.toggleInput}
              />
              <div className={styles.toggleContent}>
                <span className={styles.toggleIcon}>🚧</span>
                <span className={styles.toggleLabel}>Fence</span>
                <span className={styles.toggleHint}>Fenced areas or gates</span>
              </div>
              <div className={styles.toggleCheck}>✓</div>
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <h4 className={styles.summaryTitle}>Property Summary</h4>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{formData.totalSqft.toLocaleString()}</span>
              <span className={styles.summaryLabel}>Total sq ft</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{formData.treeCount}</span>
              <span className={styles.summaryLabel}>Trees</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{formData.bushCount}</span>
              <span className={styles.summaryLabel}>Bushes</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>
                {[formData.hasPool && 'Pool', formData.hasFence && 'Fence'].filter(Boolean).join(', ') || 'None'}
              </span>
              <span className={styles.summaryLabel}>Features</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className="btn btn-primary btn-lg">
            Continue to Services
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
