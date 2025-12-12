"use client";

import { useState, useRef } from "react";
import styles from "./PropertyMap.module.css";
import type { Coordinates, PropertyZone } from "@/types";

interface PropertyMapProps {
  center: Coordinates;
  address: string;
  onPolygonComplete: (zones: PropertyZone[], totalArea: number) => void;
  onBack: () => void;
}

export default function PropertyMap({ center, address, onPolygonComplete, onBack }: PropertyMapProps) {
  const [mode, setMode] = useState<'select' | 'draw' | 'manual'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Coordinates[]>([]);
  const [area, setArea] = useState<number | null>(null);
  const [manualSqft, setManualSqft] = useState<string>('');
  const mapRef = useRef<HTMLDivElement>(null);

  // Calculate polygon area (simplified)
  const calculateArea = (coords: Coordinates[]): number => {
    if (coords.length < 3) return 0;
    
    // Shoelace formula for polygon area
    let area = 0;
    const n = coords.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coords[i].lat * coords[j].lng;
      area -= coords[j].lat * coords[i].lng;
    }
    
    // Convert to approximate square feet (rough estimate for lat/lng at this location)
    const sqDegrees = Math.abs(area) / 2;
    const sqFeet = sqDegrees * 364000 * 288000;
    
    return Math.round(sqFeet);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const newPoint: Coordinates = {
      lat: center.lat + (0.5 - y) * 0.002,
      lng: center.lng + (x - 0.5) * 0.002,
    };
    
    const newPoints = [...points, newPoint];
    setPoints(newPoints);
    
    // Calculate area when we have enough points
    if (newPoints.length >= 3) {
      setArea(calculateArea(newPoints));
    }
  };

  const handleStartDrawing = () => {
    setMode('draw');
    setIsDrawing(true);
    setPoints([]);
    setArea(null);
  };

  const handleFinishDrawing = () => {
    setIsDrawing(false);
    if (points.length >= 3 && area) {
      const drawnZone: PropertyZone = {
        id: 'drawn-zone', // A unique ID for this drawn zone
        type: 'lawn', // Assuming it's a lawn for now
        path: points,
        area: area,
      };
      onPolygonComplete([drawnZone], area);
    }
  };

  const handleClearDrawing = () => {
    setPoints([]);
    setArea(null);
    setIsDrawing(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sqft = parseInt(manualSqft, 10);
    if (sqft > 0) {
      const mockZone: PropertyZone = {
          id: 'manual',
          type: 'other',
          path: [],
          area: sqft
      };
      onPolygonComplete([mockZone], sqft);
    }
  };

  const handleQuickSelect = (sqft: number) => {
    const mockZone: PropertyZone = {
      id: 'quick-select',
      type: 'other',
      path: [],
      area: sqft
    };
    onPolygonComplete([mockZone], sqft);
  };

  return (
    <div className={styles.propertyMap}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className={styles.addressDisplay}>
          <span className={styles.addressIcon}>📍</span>
          <span className={styles.addressText}>{address}</span>
        </div>
      </div>

      {/* Mode Selection */}
      {mode === 'select' && (
        <div className={styles.modeSelection}>
          <h2 className={styles.modeTitle}>How would you like to estimate your property size?</h2>
          
          <div className={styles.modeGrid}>
            <button 
              onClick={handleStartDrawing}
              className={styles.modeCard}
            >
              <div className={styles.modeIcon}>✏️</div>
              <h3>Draw Boundary</h3>
              <p>Click to draw your property outline on the map</p>
            </button>

            <button 
              onClick={() => setMode('manual')}
              className={styles.modeCard}
            >
              <div className={styles.modeIcon}>📐</div>
              <h3>Enter Square Footage</h3>
              <p>Manually enter your property size if you know it</p>
            </button>
          </div>

          <div className={styles.quickSelectSection}>
            <h3 className={styles.quickSelectTitle}>Or select an estimate:</h3>
            <div className={styles.quickSelectGrid}>
              <button onClick={() => handleQuickSelect(2500)} className={styles.quickBtn}>
                Small Yard<br/><strong>~2,500 sq ft</strong>
              </button>
              <button onClick={() => handleQuickSelect(5000)} className={styles.quickBtn}>
                Medium Yard<br/><strong>~5,000 sq ft</strong>
              </button>
              <button onClick={() => handleQuickSelect(10000)} className={styles.quickBtn}>
                Large Yard<br/><strong>~10,000 sq ft</strong>
              </button>
              <button onClick={() => handleQuickSelect(20000)} className={styles.quickBtn}>
                Estate<br/><strong>~20,000+ sq ft</strong>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Mode */}
      {mode === 'manual' && (
        <div className={styles.manualEntry}>
          <div className={styles.manualCard}>
            <div className={styles.manualIcon}>📐</div>
            <h2>Enter Your Property Size</h2>
            <p>If you know your total landscaped area, enter it below for the most accurate quote.</p>
            
            <div className={styles.manualInputGroup}>
              <input
                type="number"
                value={manualSqft}
                onChange={(e) => setManualSqft(e.target.value)}
                placeholder="e.g., 5000"
                className={styles.manualInput}
                min="100"
                max="100000"
              />
              <span className={styles.manualUnit}>sq ft</span>
            </div>

            <div className={styles.manualHelper}>
              <p>💡 <strong>Tips for estimating:</strong></p>
              <ul>
                <li>Average front yard: 1,000 - 2,500 sq ft</li>
                <li>Average backyard: 2,000 - 5,000 sq ft</li>
                <li>Large property: 10,000+ sq ft</li>
              </ul>
            </div>

            <div className={styles.manualActions}>
              <button
                onClick={handleManualSubmit}
                className="btn btn-primary btn-lg"
                disabled={!manualSqft || parseInt(manualSqft, 10) < 100}
              >
                Continue with {manualSqft ? parseInt(manualSqft, 10).toLocaleString() : '—'} sq ft
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setMode('select')}
                className="btn btn-secondary"
              >
                Back to Options
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Mode */}
      {mode === 'draw' && (
        <>
          <div className={styles.mapContainer}>
            <div 
              ref={mapRef}
              className={`${styles.mapPlaceholder} ${isDrawing ? styles.drawing : ''}`}
              onClick={handleMapClick}
            >
              <div className={styles.satelliteOverlay}>
                <div className={styles.gridLines}></div>
                <div className={styles.centerMarker}>
                  <div className={styles.markerPulse}></div>
                  <div className={styles.markerPin}>📍</div>
                </div>
                
                {/* Draw polygon points */}
                {points.map((point, index) => {
                  const x = ((point.lng - center.lng) / 0.002 + 0.5) * 100;
                  const y = (0.5 - (point.lat - center.lat) / 0.002) * 100;
                  
                  return (
                    <div
                      key={index}
                      className={styles.polygonPoint}
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      {index + 1}
                    </div>
                  );
                })}

                {/* Connect points with lines */}
                {points.length >= 2 && (
                  <svg className={styles.polygonLines}>
                    <polygon
                      points={points.map(p => {
                        const x = ((p.lng - center.lng) / 0.002 + 0.5) * 100;
                        const y = (0.5 - (p.lat - center.lat) / 0.002) * 100;
                        return `${x}%,${y}%`;
                      }).join(' ')}
                      fill="rgba(45, 90, 39, 0.2)"
                      stroke="var(--color-primary)"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </div>
              
              {isDrawing && (
                <div className={styles.drawingInstructions}>
                  <p>Click on the map to add points around your property</p>
                  <p className={styles.pointCount}>{points.length} points added {points.length < 3 && '(min 3)'}</p>
                </div>
              )}
            </div>

            <div className={styles.mapControls}>
              <button className={styles.zoomBtn} title="Zoom in">+</button>
              <button className={styles.zoomBtn} title="Zoom out">−</button>
            </div>

            <div className={styles.mapNote}>
              <p>🗺️ <strong>Demo Mode</strong> - In production, this would show satellite imagery of your property via Google Maps.</p>
            </div>
          </div>

          {/* Area display */}
          {area && (
            <div className={styles.areaDisplay}>
              <div className={styles.areaIcon}>📐</div>
              <div className={styles.areaInfo}>
                <span className={styles.areaLabel}>Estimated Property Area</span>
                <span className={styles.areaValue}>
                  {area.toLocaleString()} sq ft
                  <span className={styles.areaAcres}>
                    ({(area / 43560).toFixed(2)} acres)
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actions}>
            {isDrawing && (
              <>
                <button
                  onClick={handleFinishDrawing}
                  className="btn btn-primary"
                  disabled={points.length < 3}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Complete Boundary ({points.length} points)
                </button>
                <button
                  onClick={handleClearDrawing}
                  className="btn btn-secondary"
                >
                  Clear & Redraw
                </button>
                <button
                  onClick={() => setMode('select')}
                  className="btn btn-secondary"
                >
                  Back to Options
                </button>
              </>
            )}

            {!isDrawing && points.length >= 3 && (
              <>
                <button
                  onClick={handleFinishDrawing}
                  className="btn btn-primary btn-lg"
                >
                  Continue with {area?.toLocaleString()} sq ft
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={handleClearDrawing}
                  className="btn btn-secondary"
                >
                  Redraw
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
