"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import styles from "./AIAnalysis.module.css";
import type { Coordinates } from "@/types";
import type { PropertyAnalysis, FeatureLocation } from "@/types/property";
import { ServiceType } from "@/services/site-manager/types";
import MobileCameraFlow from "./MobileCameraFlow";

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
  const [serviceType, setServiceType] = useState<ServiceType>('landscaping');
  const [mobileCameraMode, setMobileCameraMode] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<PropertyAnalysis | null>(null);
  const [satelliteUrl, setSatelliteUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState<PropertyAnalysis | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showMasks, setShowMasks] = useState({
    lawn: true,
    trees: true,
    fence: true,
    pathway: true,
    pool: true,
  });
  const [userPhotos, setUserPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Generate all image URLs for the carousel
  const getImageUrls = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    return [
      { label: "Very Close Satellite", url: `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=21&size=640x640&maptype=satellite&key=${apiKey}` },
      { label: "Close Satellite", url: `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=20&size=640x640&maptype=satellite&key=${apiKey}` },
      { label: "Medium Satellite", url: `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=19&size=640x640&maptype=satellite&key=${apiKey}` },
      { label: "Street View Front", url: `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${coordinates.lat},${coordinates.lng}&fov=100&pitch=10&key=${apiKey}` },
      { label: "Street View Left", url: `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${coordinates.lat},${coordinates.lng}&fov=100&heading=270&pitch=10&key=${apiKey}` },
      { label: "Street View Right", url: `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${coordinates.lat},${coordinates.lng}&fov=100&heading=90&pitch=10&key=${apiKey}` },
    ];
  };

  const imageUrls = getImageUrls();

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newPhotos = [...userPhotos, ...files].slice(0, 6);
    setUserPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map(f => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const newPhotos = userPhotos.filter((_, i) => i !== index);
    setUserPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map(f => URL.createObjectURL(f)));
  };

  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  // Clear countdown on unmount
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const startRetryTimer = (seconds: number) => {
    setRetryCountdown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError("");
    setRetryCountdown(null);

    try {
      // Use FormData if user has photos, otherwise JSON
      let response;
      if (userPhotos.length > 0) {
        const formData = new FormData();
        formData.append("lat", coordinates.lat.toString());
        formData.append("lng", coordinates.lng.toString());
        formData.append("address", address);
        formData.append("serviceType", serviceType);
        userPhotos.forEach(photo => formData.append("photos", photo));
        
        response = await fetch("/api/analyze-property", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/analyze-property", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: coordinates.lat,
            lng: coordinates.lng,
            address,
            serviceType,
          }),
        });
      }

      const data = await response.json();

      if (response.status === 429) {
        const waitTime = 30;
        startRetryTimer(waitTime);
        throw new Error(`High demand! Retrying available in ${waitTime}s...`);
      }

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

  const handleEnhance = async () => {
    if (!satelliteUrl) return;
    setIsEnhancing(true);
    try {
        const res = await fetch('/api/site-manager/enhance', {
            method: 'POST',
            body: JSON.stringify({ imageUrl: satelliteUrl })
        });
        const data = await res.json();
        if (data.url) {
            setEnhancedUrl(data.url);
        }
    } catch (e) {
        console.error("Failed to enhance:", e);
    } finally {
        setIsEnhancing(false);
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

  const increment = (field: "lawnSqft" | "treeCount" | "bushCount" | "gardenBeds" | "fenceLength" | "pathwaySqft", amount: number) => {
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

  // Get locations for the current image (uses per-image locations if available)
  const getLocationsForImage = (imageIndex: number): FeatureLocation[] => {
    if (!editedAnalysis) return [];
    
    // Check for new locationsByImage format first
    if (editedAnalysis.locationsByImage) {
      const imageKey = `image${imageIndex + 1}` as keyof typeof editedAnalysis.locationsByImage;
      const locs = editedAnalysis.locationsByImage[imageKey];
      if (locs && locs.length > 0) return locs;
    }
    
    // Fall back to legacy locations (only show on first image)
    if (imageIndex === 0 && editedAnalysis.locations) {
      return editedAnalysis.locations;
    }
    
    return [];
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



        {/* Service Type Toggle */}
        <div className={styles.serviceToggle}>
          <button 
             className={`${styles.toggleBtn} ${serviceType === 'landscaping' ? styles.toggleActive : ''}`}
             onClick={() => setServiceType('landscaping')}
          >
            🌿 Landscaping
          </button>
          <button 
             className={`${styles.toggleBtn} ${serviceType === 'dump' ? styles.toggleActive : ''}`}
             onClick={() => setServiceType('dump')}
          >
            🗑️ Junk Removal
          </button>
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

        {/* Photo Upload Section */}
        <div className={styles.photoUploadSection}>
          <h3 className={styles.photoTitle}>📸 Add Your Own Photos (Optional)</h3>
          <p className={styles.photoSubtitle}>Take photos of your yard for more accurate analysis</p>
          
          <div className={styles.photoButtons}>
            <button
              onClick={() => setMobileCameraMode(true)}
              className={styles.cameraBtn}
            >
              📷 Guided Camera Scan
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
            onChange={handlePhotoSelect}
            className={styles.hiddenInput}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className={styles.hiddenInput}
          />

          {photoPreviews.length > 0 && (
            <div className={styles.userPhotoGrid}>
              {photoPreviews.map((preview, index) => (
                <div key={index} className={styles.userPhotoItem}>
                  <Image
                    src={preview}
                    alt={`Your photo ${index + 1}`}
                    width={80}
                    height={80}
                    className={styles.userPhotoImg}
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className={styles.removePhotoBtn}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {userPhotos.length > 0 && (
            <p className={styles.photoCount}>{userPhotos.length}/6 photos added • GPS: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</p>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {retryCountdown !== null && (
          <div className={styles.retryMessage}>
            Server busy. Auto-retry enabled in {retryCountdown}s
          </div>
        )}

        <div className={styles.actions}>
          <button
            onClick={runAnalysis}
            className="btn btn-primary btn-lg"
            type="button"
            disabled={isAnalyzing || retryCountdown !== null}
          >
            {retryCountdown !== null 
              ? `⏳ Cooldown: ${retryCountdown}s` 
              : `🔍 Analyze Property with AI ${userPhotos.length > 0 ? `(+${userPhotos.length} photos)` : ''}`}
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
      {mobileCameraMode && (
        <MobileCameraFlow 
          serviceType={serviceType}
          onCancel={() => setMobileCameraMode(false)}
          onComplete={(photos) => {
             const newPhotos = [...userPhotos, ...photos].slice(0, 6);
             setUserPhotos(newPhotos);
             setPhotoPreviews(newPhotos.map(f => URL.createObjectURL(f)));
             setMobileCameraMode(false);
          }}
        />
      )}

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
          <div className="relative w-full h-full aspect-[4/3]">
             {/* If enhanced, show split screen slider or toggle */}
             {enhancedUrl && activeImageIndex === 0 ? (
               <div className="relative w-full h-full group">
                 {/* Underlying Enhanced Image */}
                 <Image 
                   src={enhancedUrl} 
                   alt="Enhanced View"
                   fill
                   className="object-cover"
                 />
                 
                 {/* Overlay Original Image (clipped) */}
                 <div 
                   className="absolute top-0 left-0 h-full w-1/2 overflow-hidden border-r-2 border-white/50"
                   style={{ width: '50%', transition: 'width 0.1s' }}
                 >
                    <Image 
                      src={imageUrls[activeImageIndex].url}
                      alt="Original View"
                      fill
                      className="object-cover object-left"
                    />
                 </div>
                 <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Original</div>
                 <div className="absolute top-2 right-2 bg-emerald-600/80 text-white text-xs px-2 py-1 rounded">✨ Enhanced</div>
               </div>
             ) : (
                <Image
                  src={imageUrls[activeImageIndex].url}
                  alt={imageUrls[activeImageIndex].label}
                  fill
                  className={`${styles.satelliteImage} object-cover`}
                />
             )}
             
             {/* Enhance Button (Only for satellite view 0 for now) */}
             {activeImageIndex === 0 && !enhancedUrl && (
               <button
                 onClick={handleEnhance}
                 disabled={isEnhancing}
                 className="absolute bottom-4 right-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold transition-all z-20"
               >
                 {isEnhancing ? (
                   <>
                     <span className="animate-spin">⏳</span> Enhancing...
                   </>
                 ) : (
                   <>
                     ✨ Enhance Clarity
                   </>
                 )}
               </button>
             )}
          </div>
          
              {/* Visual Feature Masks - Show on satellite views using per-image coordinates */}
              {activeImageIndex < 6 && (() => {
                const imageKey = `image${activeImageIndex + 1}` as 'image1' | 'image2' | 'image3' | 'image4' | 'image5' | 'image6';
                const samMasks = editedAnalysis?.samMasksByImage?.[imageKey];
                const hasSAM = samMasks && samMasks.length > 0;
                const isSatellite = activeImageIndex < 3; // Legacy markers only work on satellite views

                // Helper to check if a SAM mask type should be shown based on toggles
                const shouldShowSAMMask = (type: string) => {
                  if (type.includes('tree') || type.includes('bush')) return showMasks.trees;
                  if (type.includes('lawn')) return showMasks.lawn;
                  if (type.includes('fence')) return showMasks.fence;
                  if (type.includes('pool')) return showMasks.pool;
                  if (type.includes('path') || type.includes('driveway') || type.includes('patio')) return showMasks.pathway;
                  // All other types (solar, shed, etc) default to true or map to closest category
                  return true;
                };

                return (
                  <div className={styles.featureMasks}>
                    {/* --- LEGACY MARKERS (Fallback Only - Satellite Only) --- */}
                    {/* Only show these if SAM data is MISSING for this image AND it's a satellite view */}
                    
                    {!hasSAM && isSatellite && (
                      <>
                        {/* Lawn Area Mask - Generic Overlay */}
                        {showMasks.lawn && (editedAnalysis?.lawnSqft || 0) > 0 && (
                          <div 
                            className={styles.maskLawn}
                            title={`Lawn: ~${editedAnalysis?.lawnSqft?.toLocaleString()} sq ft`}
                          />
                        )}
                        
                        {/* Trees Markers */}
                        {showMasks.trees && (
                          <div className={styles.maskTrees}>
                            {getLocationsForImage(activeImageIndex).filter(l => l.type === 'tree').map((l, i) => (
                              <div 
                                key={`tree-${i}`} 
                                className={styles.treeMarker}
                                style={{
                                  left: `${l.x}%`,
                                  top: `${l.y}%`,
                                  width: l.w ? `${l.w}%` : undefined,
                                  height: l.h ? `${l.h}%` : undefined,
                                }}
                                title="Tree (AI Detected)"
                              />
                            ))}
                            
                            {/* Bush Markers */}
                            {getLocationsForImage(activeImageIndex).filter(l => l.type === 'bush').map((l, i) => (
                              <div 
                                key={`bush-${i}`} 
                                className={styles.treeMarker}
                                style={{
                                  left: `${l.x}%`,
                                  top: `${l.y}%`,
                                  width: l.w ? `${l.w}%` : '2%',
                                  height: l.h ? `${l.h}%` : '2%',
                                  backgroundColor: '#86efac', // Light green for bushes
                                  borderRadius: '50%'
                                }}
                                title="Bush (AI Detected)"
                              />
                            ))}

                            {/* Fallback only if count > 0 but NO locations found */}
                            {(getLocationsForImage(activeImageIndex).filter(l => l.type === 'tree').length === 0) && (editedAnalysis?.treeCount || 0) > 0 && (
                               Array.from({ length: Math.min(editedAnalysis?.treeCount || 0, 5) }).map((_, i) => (
                                  <div key={`fallback-${i}`} className={styles.treeMarker} style={{ left: '50%', top: '50%', opacity: 0.5 }} title="Tree (Location Unknown)" />
                               ))
                            )}
                          </div>
                        )}

                        {/* Pool Markers */}
                        {showMasks.pool && (
                           <div className={styles.maskPoolContainer}>
                              {getLocationsForImage(activeImageIndex).filter(l => l.type === 'pool').map((l, i) => (
                                <div 
                                  key={`pool-${i}`}
                                  className={styles.maskPool} 
                                  style={{
                                    left: `${l.x}%`,
                                    top: `${l.y}%`,
                                    width: `${l.w || 10}%`,
                                    height: `${l.h || 10}%`,
                                    position: 'absolute' 
                                  }}
                                  title="Pool Detected"
                                />
                              ))}
                           </div>
                        )}
                        
                        {/* Fence Mask */}
                        {showMasks.fence && (editedAnalysis?.fenceLength || 0) > 0 && (
                          <div 
                            className={styles.maskFence}
                            title={`Fence: ~${editedAnalysis?.fenceLength} linear ft`}
                          />
                        )}
                      </>
                    )}
                    
                    {/* --- SAM 3 SEGMENTATION POLYGONS (Priority) --- */}
                    {hasSAM && (
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                        }}
                        viewBox="0 0 640 640"
                        preserveAspectRatio="none"
                      >
                        {samMasks
                          .filter((mask) => shouldShowSAMMask(mask.type)) // Respect toggles!
                          .map((mask, i) => (
                          mask.polygon && mask.polygon.length > 2 && (
                            <polygon
                              key={`sam-mask-${i}`}
                              points={mask.polygon.map((p) => `${p[0]},${p[1]}`).join(' ')}
                              fill={mask.color || 'rgba(100, 100, 100, 0.3)'}
                              stroke={mask.color?.replace('0.4', '0.8').replace('0.5', '0.9') || 'rgba(100, 100, 100, 0.7)'}
                              strokeWidth="2"
                            />
                          )
                        ))}
                      </svg>
                    )}
                  </div>
                );
              })()}
          
          {/* Mask Legend & Toggles */}
          {activeImageIndex < 3 && (
            <div className={styles.maskLegend}>
              <div className={styles.legendTitle}>Feature Masks:</div>
              <div className={styles.legendItems}>
                <button 
                  className={`${styles.legendItem} ${showMasks.lawn ? styles.legendActive : ''}`}
                  onClick={() => setShowMasks(m => ({ ...m, lawn: !m.lawn }))}
                >
                  <span className={styles.legendColor} style={{ background: 'rgba(34, 197, 94, 0.5)' }} />
                  Lawn
                </button>
                <button 
                  className={`${styles.legendItem} ${showMasks.trees ? styles.legendActive : ''}`}
                  onClick={() => setShowMasks(m => ({ ...m, trees: !m.trees }))}
                >
                  <span className={styles.legendColor} style={{ background: '#15803d' }} />
                  Trees
                </button>
                <button 
                  className={`${styles.legendItem} ${showMasks.fence ? styles.legendActive : ''}`}
                  onClick={() => setShowMasks(m => ({ ...m, fence: !m.fence }))}
                >
                  <span className={styles.legendColor} style={{ background: '#f59e0b' }} />
                  Fence
                </button>
                <button 
                  className={`${styles.legendItem} ${showMasks.pathway ? styles.legendActive : ''}`}
                  onClick={() => setShowMasks(m => ({ ...m, pathway: !m.pathway }))}
                >
                  <span className={styles.legendColor} style={{ background: 'rgba(168, 162, 158, 0.7)' }} />
                  Path
                </button>
                <button 
                  className={`${styles.legendItem} ${showMasks.pool ? styles.legendActive : ''}`}
                  onClick={() => setShowMasks(m => ({ ...m, pool: !m.pool }))}
                >
                  <span className={styles.legendColor} style={{ background: 'rgba(59, 130, 246, 0.6)' }} />
                  Pool
                </button>
              </div>
              
              {/* SAM Mask Count (from consensus analysis) */}
              {editedAnalysis?.samMasksByImage && (
                (() => {
                  const totalMasks = Object.values(editedAnalysis.samMasksByImage)
                    .filter((arr): arr is NonNullable<typeof arr> => !!arr)
                    .reduce((sum, arr) => sum + arr.length, 0);
                  if (totalMasks === 0) return null;
                  return (
                    <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      ✨ {totalMasks} SAM masks generated
                    </div>
                  );
                })()
              )}
            </div>
          )}
          
          {/* AI Results Overlay */}
          <div className={styles.resultsOverlay}>
            <div className={styles.overlayTitle}>🤖 AI Detected:</div>
            <div className={styles.overlayGrid}>
              <div className={styles.overlayItem}>
                <span className={styles.overlayIcon}>🌿</span>
                <span className={styles.overlayValue}>{editedAnalysis?.lawnSqft?.toLocaleString() || 0}</span>
                <span className={styles.overlayLabel}>sq ft lawn</span>
              </div>
              <div className={styles.overlayItem}>
                <span className={styles.overlayIcon}>🌳</span>
                <span className={styles.overlayValue}>{editedAnalysis?.treeCount || 0}</span>
                <span className={styles.overlayLabel}>trees</span>
              </div>
              <div className={styles.overlayItem}>
                <span className={styles.overlayIcon}>🌲</span>
                <span className={styles.overlayValue}>{editedAnalysis?.bushCount || 0}</span>
                <span className={styles.overlayLabel}>bushes</span>
              </div>
              <div className={styles.overlayItem}>
                <span className={styles.overlayIcon}>🌺</span>
                <span className={styles.overlayValue}>{editedAnalysis?.gardenBeds || 0}</span>
                <span className={styles.overlayLabel}>garden beds</span>
              </div>
              {(editedAnalysis?.fenceLength || 0) > 0 && (
                <div className={styles.overlayItem}>
                  <span className={styles.overlayIcon}>🚧</span>
                  <span className={styles.overlayValue}>{editedAnalysis?.fenceLength}</span>
                  <span className={styles.overlayLabel}>ft fence</span>
                </div>
              )}
              {(editedAnalysis?.pathwaySqft || 0) > 0 && (
                <div className={styles.overlayItem}>
                  <span className={styles.overlayIcon}>🛤️</span>
                  <span className={styles.overlayValue}>{editedAnalysis?.pathwaySqft}</span>
                  <span className={styles.overlayLabel}>sq ft path</span>
                </div>
              )}
              {editedAnalysis?.hasPool && (
                <div className={styles.overlayItem}>
                  <span className={styles.overlayIcon}>🏊</span>
                  <span className={styles.overlayValue}>Yes</span>
                  <span className={styles.overlayLabel}>pool</span>
                </div>
              )}
            </div>
          </div>
          
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
          <span className={styles.valueIcon}>🚧</span>
          <span className={styles.valueLabel}>Fence Length</span>
          <div className={styles.valueControls}>
            <button onClick={() => increment("fenceLength", -10)} className={styles.decrementBtn}>-10</button>
            <input
              type="number"
              value={editedAnalysis?.fenceLength || 0}
              onChange={(e) => updateField("fenceLength", parseInt(e.target.value) || 0)}
              className={styles.valueInput}
            />
            <button onClick={() => increment("fenceLength", 10)} className={styles.incrementBtn}>+10</button>
          </div>
          <span className={styles.valueUnit}>linear ft</span>
        </div>

        <div className={styles.valueCard}>
          <span className={styles.valueIcon}>🛤️</span>
          <span className={styles.valueLabel}>Pathway</span>
          <div className={styles.valueControls}>
            <button onClick={() => increment("pathwaySqft", -25)} className={styles.decrementBtn}>-25</button>
            <input
              type="number"
              value={editedAnalysis?.pathwaySqft || 0}
              onChange={(e) => updateField("pathwaySqft", parseInt(e.target.value) || 0)}
              className={styles.valueInput}
            />
            <button onClick={() => increment("pathwaySqft", 25)} className={styles.incrementBtn}>+25</button>
          </div>
          <span className={styles.valueUnit}>sq ft</span>
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
          <h4>🤖 AI Observations & Inferred Items:</h4>
          
          {/* Item Approval Checklist */}
          {editedAnalysis.notes.some(n => n.includes('Item learned:') || n.includes('Verified')) ? (
             <div className={styles.itemApprovalList}>
                <p className={styles.itemApprovalTitle}>Please confirm the items we detected:</p>
                <div className={styles.approvalGrid}>
                  {editedAnalysis.notes
                    .filter(note => !note.startsWith('[') && !note.includes('Verified')) // Filter out debug logs
                    .map((item, i) => (
                    <label key={i} className={styles.approvalItem}>
                      <input 
                        type="checkbox" 
                        defaultChecked={true}
                        onChange={(e) => {
                           if (!editedAnalysis) return;
                           // If unchecked, remove from notes implementation
                           // This is a simple MVP toggle
                           if (!e.target.checked) {
                              const newNotes = editedAnalysis.notes.filter((_, idx) => idx !== i);
                              setEditedAnalysis({ ...editedAnalysis, notes: newNotes });
                           }
                        }}
                      />
                      <span className={styles.approvalText}>{item.replace(/^-\s*/, '')}</span>
                    </label>
                  ))}
                </div>
             </div>
          ) : (
            <ul>
                {editedAnalysis.notes.map((note, i) => (
                <li key={i}>{note}</li>
                ))}
            </ul>
          )}
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
