"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./YardPhotos.module.css";
import type { Coordinates } from "@/types";

interface YardPhoto {
  file: File;
  preview: string;
  coordinates?: Coordinates;
  timestamp: Date;
}

interface YardPhotosProps {
  onPhotosChange: (photos: YardPhoto[]) => void;
  coordinates?: Coordinates;
}

export default function YardPhotos({ onPhotosChange, coordinates: propCoordinates }: YardPhotosProps) {
  const [photos, setPhotos] = useState<YardPhoto[]>([]);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'success' | 'error'>(propCoordinates ? 'success' : 'idle');
  const [currentGps, setCurrentGps] = useState<Coordinates | null>(propCoordinates || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }

    if (!window.isSecureContext) {
      console.warn("[YardPhotos] Geolocation requires a secure context (HTTPS)");
      setGpsStatus('error');
      return;
    }

    setGpsStatus('getting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentGps(coords);
        setGpsStatus('success');
      },
      (error) => {
        console.error("[YardPhotos] GPS error:", error);
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Get GPS location on mount
  useEffect(() => {
    if (!propCoordinates) {
      getGpsLocation();
    }
  }, [propCoordinates]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos: YardPhoto[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      coordinates: currentGps || undefined,
      timestamp: new Date(),
    }));

    // Limit to 8 photos total
    const allPhotos = [...photos, ...newPhotos].slice(0, 8);
    setPhotos(allPhotos);
    onPhotosChange(allPhotos);

    // Reset input
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
  };

  return (
    <div className={styles.yardPhotosContainer}>
      <div className={styles.header}>
        <h3>📸 Add Yard Photos (Optional)</h3>
        <p>Take photos of your yard to help AI provide more accurate estimates</p>
      </div>

      {/* GPS Status */}
      <div className={styles.gpsStatus}>
        {gpsStatus === 'getting' && (
          <span className={styles.gpsGetting}>📍 Getting your location...</span>
        )}
        {gpsStatus === 'success' && currentGps && (
          <span className={styles.gpsSuccess}>
            ✅ GPS: {currentGps.lat.toFixed(5)}, {currentGps.lng.toFixed(5)}
          </span>
        )}
        {gpsStatus === 'error' && (
          <button onClick={getGpsLocation} className={styles.gpsRetry}>
            ⚠️ GPS unavailable - Click to retry
          </button>
        )}
      </div>

      {/* Photo Capture Buttons */}
      <div className={styles.captureButtons}>
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
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className={styles.photoGrid}>
          {photos.map((photo, index) => (
            <div key={index} className={styles.photoItem}>
              <Image
                src={photo.preview}
                alt={`Yard photo ${index + 1}`}
                width={120}
                height={120}
                className={styles.photoImage}
              />
              <div className={styles.photoInfo}>
                {photo.coordinates && <span className={styles.gpsTag}>📍</span>}
              </div>
              <button
                onClick={() => removePhoto(index)}
                className={styles.removeBtn}
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < 8 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className={styles.addMoreBtn}
            >
              + Add
            </button>
          )}
        </div>
      )}

      {photos.length > 0 && (
        <p className={styles.photoCount}>
          {photos.length}/8 photos • {photos.filter(p => p.coordinates).length} with GPS
        </p>
      )}

      {/* Tips */}
      <div className={styles.tips}>
        <h4>📝 Tips for best analysis:</h4>
        <ul>
          <li>Take photos from different angles of your yard</li>
          <li>Include front, back, and side views</li>
          <li>Capture any areas needing special attention</li>
          <li>Show trees, bushes, fences, and pathways</li>
        </ul>
      </div>
    </div>
  );
}
