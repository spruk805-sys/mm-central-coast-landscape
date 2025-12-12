"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./AIAnalysis.module.css";
import type { Coordinates } from "@/types";

interface PropertyAnalysis {
  lawnSqft: number;
  treeCount: number;
  bushCount: number;
  hasPool: boolean;
  hasFence: boolean;
  gardenBeds: number;
  drivewayPresent: boolean;
  confidence: number;
  notes: string[];
}

interface AIAnalysisProps {
  coordinates: Coordinates;
  address: string;
  onAnalysisComplete: (analysis: PropertyAnalysis) => void;
  onSkip: () => void;
}

export default function AIAnalysis({ 
  coordinates, 
  address, 
  onAnalysisComplete, 
  onSkip 
}: AIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<PropertyAnalysis | null>(null);
  const [satelliteUrl, setSatelliteUrl] = useState<string | null>(null);
  const [editedAnalysis, setEditedAnalysis] = useState<PropertyAnalysis | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Generate all image URLs for the carousel
  const getImageUrls = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    return [
      { label: "Close-up Satellite", url: `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=20&size=640x640&maptype=satellite&key=${apiKey}` },
      { label: "Medium Satellite", url: `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=19&size=640x640&maptype=satellite&key=${apiKey}` },
      { label: "Wide Satellite", url: `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=18&size=640x640&maptype=satellite&key=${apiKey}` },
      { label: "Street View Front", url: `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${coordinates.lat},${coordinates.lng}&fov=100&pitch=10&key=${apiKey}` },
      { label: "Street View Left", url: `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${coordinates.lat},${coordinates.lng}&fov=100&heading=270&pitch=10&key=${apiKey}` },
      { label: "Street View Right", url: `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${coordinates.lat},${coordinates.lng}&fov=100&heading=90&pitch=10&key=${apiKey}` },
    ];
  };

  const imageUrls = getImageUrls();

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/analyze-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: coordinates.lat,
          lng: coordinates.lng,
          address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data.analysis);
      setEditedAnalysis(data.analysis);
      setSatelliteUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze property");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (editedAnalysis) {
      onAnalysisComplete(editedAnalysis);
    }
  };

  const updateField = (field: keyof PropertyAnalysis, value: number | boolean) => {
    if (editedAnalysis) {
      setEditedAnalysis({ ...editedAnalysis, [field]: value });
    }
  };

  const increment = (field: "lawnSqft" | "treeCount" | "bushCount" | "gardenBeds", amount: number) => {
    if (editedAnalysis) {
      const newValue = Math.max(0, (editedAnalysis[field] || 0) + amount);
      setEditedAnalysis({ ...editedAnalysis, [field]: newValue });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "#22c55e"; // green
    if (confidence >= 0.6) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High Confidence";
    if (confidence >= 0.6) return "Medium Confidence";
    return "Low Confidence - Please Review";
  };

  // Initial state - show analyze button
  if (!analysis && !isAnalyzing) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <span className={styles.icon}>🤖</span>
          </div>
          <h2 className={styles.title}>AI Property Analysis</h2>
          <p className={styles.description}>
            Our AI will analyze 6 different views of your property to detect landscaping features.
          </p>
        </div>

        <div className={styles.imageCarousel}>
          <div className={styles.carouselMain}>
            <Image
              src={imageUrls[activeImageIndex].url}
              alt={imageUrls[activeImageIndex].label}
              width={400}
              height={300}
              className={styles.satelliteImage}
            />
            <div className={styles.imageLabel}>{imageUrls[activeImageIndex].label}</div>
          </div>
          <div className={styles.carouselThumbs}>
            {imageUrls.map((img, idx) => (
              <button
                key={idx}
                className={`${styles.thumb} ${idx === activeImageIndex ? styles.thumbActive : ""}`}
                onClick={() => setActiveImageIndex(idx)}
              >
                <Image src={img.url} alt={img.label} width={60} height={45} />
              </button>
            ))}
          </div>
          <p className={styles.addressLabel}>📍 {address}</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            onClick={runAnalysis}
            className="btn btn-primary btn-lg"
            disabled={isAnalyzing}
          >
            🔍 Analyze Property with AI
          </button>
          <button
            onClick={onSkip}
            className="btn btn-secondary"
          >
            Skip - Enter Details Manually
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isAnalyzing) {
    return (
      <div className={styles.container}>
        <div className={styles.analyzing}>
          <div className={styles.spinner}></div>
          <h2 className={styles.title}>Analyzing Your Property...</h2>
          <p className={styles.description}>
            AI is examining 6 images from satellite and street view.
          </p>
          <div className={styles.steps}>
            <div className={styles.step}>📡 Fetching 3 satellite views...</div>
            <div className={styles.step}>🚗 Fetching 3 street views...</div>
            <div className={styles.step}>🌳 Detecting trees and vegetation...</div>
            <div className={styles.step}>📐 Calculating lawn area...</div>
          </div>
        </div>
      </div>
    );
  }

  // Results state with image carousel and editable values
  return (
    <div className={styles.container}>
      {/* Confidence Banner */}
      <div 
        className={styles.confidenceBanner}
        style={{ backgroundColor: getConfidenceColor(editedAnalysis?.confidence || 0) + "20", borderColor: getConfidenceColor(editedAnalysis?.confidence || 0) }}
      >
        <div className={styles.confidenceIcon}>
          {(editedAnalysis?.confidence || 0) >= 0.8 ? "✅" : (editedAnalysis?.confidence || 0) >= 0.6 ? "⚠️" : "⚠️"}
        </div>
        <div className={styles.confidenceInfo}>
          <span className={styles.confidenceLabel}>{getConfidenceLabel(editedAnalysis?.confidence || 0)}</span>
          <span className={styles.confidenceValue} style={{ color: getConfidenceColor(editedAnalysis?.confidence || 0) }}>
            {Math.round((editedAnalysis?.confidence || 0) * 100)}% Accuracy
          </span>
        </div>
        <div className={styles.confidenceBar}>
          <div 
            className={styles.confidenceFill}
            style={{ width: `${(editedAnalysis?.confidence || 0) * 100}%`, backgroundColor: getConfidenceColor(editedAnalysis?.confidence || 0) }}
          />
        </div>
      </div>

      <div className={styles.header}>
        <h2 className={styles.title}>✨ Analysis Complete!</h2>
        <p className={styles.description}>
          Use + and - buttons to adjust values. Review all 6 views below.
        </p>
      </div>

      {/* Image Carousel */}
      <div className={styles.imageCarousel}>
        <div className={styles.carouselMain}>
          <Image
            src={imageUrls[activeImageIndex].url}
            alt={imageUrls[activeImageIndex].label}
            width={500}
            height={375}
            className={styles.satelliteImage}
          />
          <div className={styles.imageLabel}>{imageUrls[activeImageIndex].label}</div>
          <div className={styles.carouselNav}>
            <button 
              onClick={() => setActiveImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length)}
              className={styles.navBtn}
            >
              ←
            </button>
            <span>{activeImageIndex + 1} / {imageUrls.length}</span>
            <button 
              onClick={() => setActiveImageIndex((prev) => (prev + 1) % imageUrls.length)}
              className={styles.navBtn}
            >
              →
            </button>
          </div>
        </div>
        <div className={styles.carouselThumbs}>
          {imageUrls.map((img, idx) => (
            <button
              key={idx}
              className={`${styles.thumb} ${idx === activeImageIndex ? styles.thumbActive : ""}`}
              onClick={() => setActiveImageIndex(idx)}
              title={img.label}
            >
              <Image src={img.url} alt={img.label} width={60} height={45} />
            </button>
          ))}
        </div>
      </div>

      {/* Editable Values with +/- buttons */}
      <div className={styles.valuesGrid}>
        <div className={styles.valueCard}>
          <span className={styles.valueIcon}>🌿</span>
          <span className={styles.valueLabel}>Lawn Area</span>
          <div className={styles.valueControls}>
            <button onClick={() => increment("lawnSqft", -100)} className={styles.decrementBtn}>-100</button>
            <input
              type="number"
              value={editedAnalysis?.lawnSqft || 0}
              onChange={(e) => updateField("lawnSqft", parseInt(e.target.value) || 0)}
              className={styles.valueInput}
            />
            <button onClick={() => increment("lawnSqft", 100)} className={styles.incrementBtn}>+100</button>
          </div>
          <span className={styles.valueUnit}>sq ft</span>
        </div>

        <div className={styles.valueCard}>
          <span className={styles.valueIcon}>🌳</span>
          <span className={styles.valueLabel}>Trees</span>
          <div className={styles.valueControls}>
            <button onClick={() => increment("treeCount", -1)} className={styles.decrementBtn}>-</button>
            <input
              type="number"
              value={editedAnalysis?.treeCount || 0}
              onChange={(e) => updateField("treeCount", parseInt(e.target.value) || 0)}
              className={styles.valueInput}
            />
            <button onClick={() => increment("treeCount", 1)} className={styles.incrementBtn}>+</button>
          </div>
        </div>

        <div className={styles.valueCard}>
          <span className={styles.valueIcon}>🌲</span>
          <span className={styles.valueLabel}>Bushes</span>
          <div className={styles.valueControls}>
            <button onClick={() => increment("bushCount", -1)} className={styles.decrementBtn}>-</button>
            <input
              type="number"
              value={editedAnalysis?.bushCount || 0}
              onChange={(e) => updateField("bushCount", parseInt(e.target.value) || 0)}
              className={styles.valueInput}
            />
            <button onClick={() => increment("bushCount", 1)} className={styles.incrementBtn}>+</button>
          </div>
        </div>

        <div className={styles.valueCard}>
          <span className={styles.valueIcon}>🌺</span>
          <span className={styles.valueLabel}>Garden Beds</span>
          <div className={styles.valueControls}>
            <button onClick={() => increment("gardenBeds", -1)} className={styles.decrementBtn}>-</button>
            <input
              type="number"
              value={editedAnalysis?.gardenBeds || 0}
              onChange={(e) => updateField("gardenBeds", parseInt(e.target.value) || 0)}
              className={styles.valueInput}
            />
            <button onClick={() => increment("gardenBeds", 1)} className={styles.incrementBtn}>+</button>
          </div>
        </div>

        <div className={styles.valueCard}>
          <span className={styles.valueIcon}>🏊</span>
          <span className={styles.valueLabel}>Pool</span>
          <button
            className={`${styles.toggleBtn} ${editedAnalysis?.hasPool ? styles.toggleActive : ""}`}
            onClick={() => updateField("hasPool", !editedAnalysis?.hasPool)}
          >
            {editedAnalysis?.hasPool ? "Yes" : "No"}
          </button>
        </div>

        <div className={styles.valueCard}>
          <span className={styles.valueIcon}>🚧</span>
          <span className={styles.valueLabel}>Fence</span>
          <button
            className={`${styles.toggleBtn} ${editedAnalysis?.hasFence ? styles.toggleActive : ""}`}
            onClick={() => updateField("hasFence", !editedAnalysis?.hasFence)}
          >
            {editedAnalysis?.hasFence ? "Yes" : "No"}
          </button>
        </div>
      </div>

      {/* AI Notes */}
      {editedAnalysis?.notes && editedAnalysis.notes.length > 0 && (
        <div className={styles.notes}>
          <h4>🤖 AI Observations:</h4>
          <ul>
            {editedAnalysis.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <button onClick={handleConfirm} className="btn btn-primary btn-lg">
          Continue with These Values
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        <button onClick={runAnalysis} className="btn btn-secondary">
          🔄 Re-analyze
        </button>
      </div>
    </div>
  );
}
