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
            Let our AI analyze satellite imagery of your property to automatically detect lawn areas, trees, bushes, and more.
          </p>
        </div>

        <div className={styles.preview}>
          <div className={styles.mapPreview}>
            <Image
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=19&size=400x300&maptype=satellite&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
              alt="Property satellite view"
              width={400}
              height={300}
              className={styles.satelliteImage}
            />
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
            Our AI is examining satellite imagery to detect landscaping features.
          </p>
          <div className={styles.steps}>
            <div className={styles.step}>📡 Fetching satellite imagery...</div>
            <div className={styles.step}>🌳 Detecting trees and vegetation...</div>
            <div className={styles.step}>📐 Calculating lawn area...</div>
            <div className={styles.step}>🏠 Identifying property features...</div>
          </div>
        </div>
      </div>
    );
  }

  // Results state
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>✨ Analysis Complete!</h2>
        <p className={styles.description}>
          Review and adjust the detected values below, then continue to get your quote.
        </p>
        <div className={styles.confidence}>
          <span>AI Confidence:</span>
          <div className={styles.confidenceBar}>
            <div 
              className={styles.confidenceFill}
              style={{ width: `${(editedAnalysis?.confidence || 0) * 100}%` }}
            />
          </div>
          <span>{Math.round((editedAnalysis?.confidence || 0) * 100)}%</span>
        </div>
      </div>

      <div className={styles.resultsGrid}>
        <div className={styles.imageSection}>
          {satelliteUrl && (
            <Image
              src={satelliteUrl}
              alt="Property satellite view"
              width={400}
              height={400}
              className={styles.satelliteImage}
            />
          )}
        </div>

        <div className={styles.dataSection}>
          <div className={styles.field}>
            <label>🌿 Lawn Area (sq ft)</label>
            <input
              type="number"
              value={editedAnalysis?.lawnSqft || 0}
              onChange={(e) => updateField("lawnSqft", parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <div className={styles.field}>
            <label>🌳 Trees</label>
            <input
              type="number"
              value={editedAnalysis?.treeCount || 0}
              onChange={(e) => updateField("treeCount", parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <div className={styles.field}>
            <label>🌲 Bushes / Shrubs</label>
            <input
              type="number"
              value={editedAnalysis?.bushCount || 0}
              onChange={(e) => updateField("bushCount", parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <div className={styles.field}>
            <label>🌺 Garden Beds</label>
            <input
              type="number"
              value={editedAnalysis?.gardenBeds || 0}
              onChange={(e) => updateField("gardenBeds", parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <div className={styles.toggleField}>
            <label>🏊 Pool / Hot Tub</label>
            <button
              className={`${styles.toggle} ${editedAnalysis?.hasPool ? styles.toggleActive : ""}`}
              onClick={() => updateField("hasPool", !editedAnalysis?.hasPool)}
            >
              {editedAnalysis?.hasPool ? "Yes" : "No"}
            </button>
          </div>

          <div className={styles.toggleField}>
            <label>🚧 Fence</label>
            <button
              className={`${styles.toggle} ${editedAnalysis?.hasFence ? styles.toggleActive : ""}`}
              onClick={() => updateField("hasFence", !editedAnalysis?.hasFence)}
            >
              {editedAnalysis?.hasFence ? "Yes" : "No"}
            </button>
          </div>
        </div>
      </div>

      {editedAnalysis?.notes && editedAnalysis.notes.length > 0 && (
        <div className={styles.notes}>
          <h4>AI Observations:</h4>
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
