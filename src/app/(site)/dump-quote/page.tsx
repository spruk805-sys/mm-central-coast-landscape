"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

interface DumpItem {
  name: string;
  quantity: number;
  estimatedWeight: string;
  estimatedSize: string;
  disposalType: 'dump' | 'donate' | 'recycle';
}

interface DumpAnalysis {
  items: DumpItem[];
  totalEstimatedWeight: string;
  totalVolume: string;
  vehicleRequired: string;
  crewSize: number;
  equipmentNeeded: string[];
  estimatedTime: string;
  estimatedCost: {
    low: number;
    high: number;
  };
  notes: string[];
  confidence: number;
}

export default function DumpQuotePage() {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DumpAnalysis | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 images
    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);

    // Create previews
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    setError("");
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const analyzeImages = async () => {
    if (images.length === 0) {
      setError("Please add at least one image");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const formData = new FormData();
      images.forEach(img => formData.append("images", img));
      formData.append("description", description);

      const response = await fetch("/api/analyze-dump", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze images");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDisposalIcon = (type: string) => {
    switch (type) {
      case 'donate': return '❤️';
      case 'recycle': return '♻️';
      default: return '🗑️';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return '#22c55e';
    if (confidence >= 0.5) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className={styles.dumpQuotePage}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <h1>🚛 Get Your Dump Quote</h1>
          <p>Take photos of items you need hauled away, and our AI will estimate the job</p>
        </div>
      </section>

      <div className="container">
        {!analysis ? (
          <div className={styles.uploadSection}>
            {/* Image Upload Area */}
            <div className={styles.uploadArea}>
              <h2>📸 Add Photos of Your Items</h2>
              <p>Take up to 5 photos showing what you need removed</p>

              {/* Camera/Upload Buttons */}
              <div className={styles.uploadButtons}>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className={styles.cameraBtn}
                >
                  📷 Take Photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.uploadBtn}
                >
                  📁 Choose Files
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className={styles.hiddenInput}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className={styles.hiddenInput}
              />

              {/* Image Previews */}
              {previews.length > 0 && (
                <div className={styles.previewGrid}>
                  {previews.map((preview, index) => (
                    <div key={index} className={styles.previewItem}>
                      <Image
                        src={preview}
                        alt={`Item ${index + 1}`}
                        width={150}
                        height={150}
                        className={styles.previewImage}
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className={styles.removeBtn}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {previews.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.addMoreBtn}
                    >
                      + Add More
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className={styles.descriptionSection}>
              <label htmlFor="description">📝 Additional Details (Optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any additional info? e.g., 'Items are in backyard', 'Need gone ASAP', 'Some furniture could be donated'"
                rows={3}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {/* Analyze Button */}
            <button
              onClick={analyzeImages}
              disabled={isAnalyzing || images.length === 0}
              className={styles.analyzeBtn}
            >
              {isAnalyzing ? (
                <>
                  <span className={styles.spinner}></span>
                  Analyzing Images...
                </>
              ) : (
                <>🤖 Get AI Quote Estimate</>
              )}
            </button>
          </div>
        ) : (
          /* Results Section */
          <div className={styles.resultsSection}>
            {/* Confidence Banner */}
            <div 
              className={styles.confidenceBanner}
              style={{ borderColor: getConfidenceColor(analysis.confidence) }}
            >
              <span>AI Confidence: {Math.round(analysis.confidence * 100)}%</span>
            </div>

            <h2>📋 Quote Estimate</h2>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <span className={styles.cardIcon}>⚖️</span>
                <span className={styles.cardLabel}>Total Weight</span>
                <span className={styles.cardValue}>{analysis.totalEstimatedWeight}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.cardIcon}>📦</span>
                <span className={styles.cardLabel}>Volume</span>
                <span className={styles.cardValue}>{analysis.totalVolume}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.cardIcon}>🚛</span>
                <span className={styles.cardLabel}>Vehicle</span>
                <span className={styles.cardValue}>{analysis.vehicleRequired}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.cardIcon}>👷</span>
                <span className={styles.cardLabel}>Crew Size</span>
                <span className={styles.cardValue}>{analysis.crewSize} {analysis.crewSize === 1 ? 'person' : 'people'}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.cardIcon}>⏱️</span>
                <span className={styles.cardLabel}>Est. Time</span>
                <span className={styles.cardValue}>{analysis.estimatedTime}</span>
              </div>
              <div className={styles.summaryCard + ' ' + styles.costCard}>
                <span className={styles.cardIcon}>💰</span>
                <span className={styles.cardLabel}>Est. Cost</span>
                <span className={styles.cardValue}>
                  ${analysis.estimatedCost.low} - ${analysis.estimatedCost.high}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className={styles.itemsSection}>
              <h3>🗂️ Items Identified ({analysis.items.length})</h3>
              <div className={styles.itemsList}>
                {analysis.items.map((item, index) => (
                  <div key={index} className={styles.itemCard}>
                    <span className={styles.itemIcon}>{getDisposalIcon(item.disposalType)}</span>
                    <div className={styles.itemDetails}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemMeta}>
                        Qty: {item.quantity} • {item.estimatedWeight} • {item.estimatedSize}
                      </span>
                    </div>
                    <span className={`${styles.disposalBadge} ${styles[item.disposalType]}`}>
                      {item.disposalType}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment Needed */}
            {analysis.equipmentNeeded.length > 0 && (
              <div className={styles.equipmentSection}>
                <h3>🛠️ Equipment Needed</h3>
                <div className={styles.equipmentList}>
                  {analysis.equipmentNeeded.map((equip, index) => (
                    <span key={index} className={styles.equipmentTag}>{equip}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {analysis.notes.length > 0 && (
              <div className={styles.notesSection}>
                <h3>📝 Notes</h3>
                <ul>
                  {analysis.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <Link href="/contact" className={styles.bookBtn}>
                📞 Book This Service
              </Link>
              <button
                onClick={() => {
                  setAnalysis(null);
                  setImages([]);
                  setPreviews([]);
                  setDescription("");
                }}
                className={styles.newQuoteBtn}
              >
                🔄 Get New Quote
              </button>
            </div>

            <p className={styles.disclaimer}>
              * This is an AI-generated estimate. Final pricing may vary based on actual conditions, access, and dump fees.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
