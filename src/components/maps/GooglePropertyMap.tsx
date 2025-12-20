"use client";

import { useState, useCallback, useRef, CSSProperties } from "react";
import { GoogleMap, DrawingManager, Polygon } from "@react-google-maps/api";
import styles from "./GooglePropertyMap.module.css";
import type { Coordinates, PropertyZone, ZoneType } from "@/types";

interface GooglePropertyMapProps {
  center: Coordinates;
  address: string;
  onPolygonComplete: (zones: PropertyZone[], totalArea: number) => void;
  onBack: () => void;
}

const mapContainerStyle = {
  width: "100%",
  height: "500px", // Increased height for better drawing experience
};

const mapOptions: google.maps.MapOptions = {
  mapTypeId: "satellite",
  tilt: 45, // Enable 3D view
  heading: 0,
  mapTypeControl: true,
  mapTypeControlOptions: {
    position: google.maps.ControlPosition?.TOP_RIGHT,
  },
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
  rotateControl: true, // Allow user to rotate map
};

const ZONE_COLORS: Record<ZoneType, string> = {
  lawn: "#4caf50",
  garden: "#e91e63",
  pool: "#03a9f4",
  tree_cluster: "#795548",
  other: "#9e9e9e",
};

const ZONE_LABELS: Record<ZoneType, string> = {
  lawn: "Lawn",
  garden: "Garden",
  pool: "Pool/Patio",
  tree_cluster: "Trees",
  other: "Other",
};

export default function GooglePropertyMap({ 
  center: initialCenter, 
  address, 
  onPolygonComplete, 
  onBack 
}: GooglePropertyMapProps) {
  const [center, setCenter] = useState<Coordinates>(initialCenter);
  const [zones, setZones] = useState<PropertyZone[]>([]);
  const [draftPolygon, setDraftPolygon] = useState<google.maps.Polygon | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showZoneSelector, setShowZoneSelector] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    if (!window.isSecureContext) {
      alert("Location services require a secure connection (HTTPS) on mobile devices. Please use an HTTPS tunnel for testing.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(newCenter);
        mapRef.current?.panTo(newCenter);
        mapRef.current?.setZoom(20);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please check your permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const onPolygonCompleteHandler = useCallback((poly: google.maps.Polygon) => {
    // Hide the drawn polygon immediately as we'll re-render it as a zone after selection
    poly.setVisible(false);
    setDraftPolygon(poly);
    setShowZoneSelector(true);
  }, []);

  const handleZoneSelect = (type: ZoneType) => {
    if (!draftPolygon) return;

    const path = draftPolygon.getPath();
    const coordinates: Coordinates[] = [];
    for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push({ lat: point.lat(), lng: point.lng() });
    }

    const areaInMeters = google.maps.geometry.spherical.computeArea(path);
    const areaInSqFt = Math.round(areaInMeters * 10.7639);

    const newZone: PropertyZone = {
      id: crypto.randomUUID(),
      type,
      path: coordinates,
      area: areaInSqFt,
    };

    setZones([...zones, newZone]);
    
    // Clean up draft polygon
    draftPolygon.setMap(null);
    setDraftPolygon(null);
    setShowZoneSelector(false);
  };

  const handleDeleteZone = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
  };

  const getTotalArea = () => zones.reduce((sum, zone) => sum + zone.area, 0);

  const handleContinue = () => {
    if (zones.length > 0) {
      onPolygonComplete(zones, getTotalArea());
    }
  };

  const handleManualEntry = () => {
    const sqft = prompt("Enter your property size in square feet:");
    if (sqft) {
      const area = parseInt(sqft, 10);
      if (area > 0) {
        // Create a mock zone for manual entry
        const mockZone: PropertyZone = {
            id: 'manual',
            type: 'other',
            path: [],
            area: area
        };
        onPolygonComplete([mockZone], area);
      }
    }
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
        <div className={styles.addressDisplay}>
          <span className={styles.addressIcon}>📍</span>
          <span className={styles.addressText}>{address}</span>
        </div>
      </div>

      <div className={styles.instructions}>
        <p>
          <strong>Step 1:</strong> Draw separate zones for different areas (Lawn, Garden, etc.).
          <br/>
          <strong>Step 2:</strong> Label each zone to get accurate service quotes.
        </p>
        <button 
          onClick={handleLocateMe} 
          className={styles.locateBtn}
          disabled={isLocating}
        >
          {isLocating ? '📍 Locating...' : '📍 Use My Location'}
        </button>
      </div>

      <div className={styles.mapWrapper}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={19}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {/* Render Saved Zones */}
          {zones.map((zone) => (
             <Polygon
               key={zone.id}
               paths={zone.path}
               options={{
                 fillColor: ZONE_COLORS[zone.type],
                 fillOpacity: 0.5,
                 strokeColor: ZONE_COLORS[zone.type],
                 strokeWeight: 2,
               }}
             />
          ))}

          {/* Drawing Manager - hidden when selecting zone type */}
          {!showZoneSelector && (
            <DrawingManager
                onPolygonComplete={onPolygonCompleteHandler}
                options={{
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition?.TOP_CENTER,
                    drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                },
                polygonOptions: {
                    fillColor: "#000",
                    fillOpacity: 0.3,
                    strokeColor: "#000",
                    strokeWeight: 2,
                    editable: true,
                    draggable: true,
                },
                }}
            />
          )}
        </GoogleMap>

        {/* Zone Type Selector Overlay */}
        {showZoneSelector && (
            <div className={styles.zoneSelectorOverlay}>
                <h3>What is this area?</h3>
                <div className={styles.zoneButtons}>
                    {(Object.keys(ZONE_LABELS) as ZoneType[]).map((type) => (
                        <button
                            key={type}
                            className={styles.zoneBtn}
                            style={{ '--zone-color': ZONE_COLORS[type] } as CSSProperties}
                            onClick={() => handleZoneSelect(type)}
                        >
                            <span className={styles.zoneDot} style={{ background: ZONE_COLORS[type] }}></span>
                            {ZONE_LABELS[type]}
                        </button>
                    ))}
                </div>
                <button 
                    className={styles.cancelZoneBtn}
                    onClick={() => {
                        draftPolygon?.setMap(null);
                        setDraftPolygon(null);
                        setShowZoneSelector(false);
                    }}
                >
                    Cancel
                </button>
            </div>
        )}
      </div>

      {/* Zone List & Total */}
      <div className={styles.zonesList}>
        <div className={styles.totalArea}>
            <span>Total Area:</span>
            <strong>{getTotalArea().toLocaleString()} sq ft</strong>
        </div>
        
        {zones.length > 0 && (
            <div className={styles.zoneItems}>
                {zones.map(zone => (
                    <div key={zone.id} className={styles.zoneItem}>
                        <span className={styles.zoneDot} style={{ background: ZONE_COLORS[zone.type] }}></span>
                        <span className={styles.zoneName}>{ZONE_LABELS[zone.type]}</span>
                        <span className={styles.zoneSize}>{zone.area.toLocaleString()} sq ft</span>
                        <button onClick={() => handleDeleteZone(zone.id)} className={styles.deleteZoneBtn}>×</button>
                    </div>
                ))}
            </div>
        )}
      </div>

      <div className={styles.actions}>
        {zones.length > 0 ? (
          <>
            <button onClick={handleContinue} className="btn btn-primary btn-lg">
              Continue with {zones.length} Zones
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button onClick={() => setZones([])} className="btn btn-secondary">
              Clear All
            </button>
          </>
        ) : (
          <button onClick={handleManualEntry} className="btn btn-secondary">
            Or Enter Total Size Manually
          </button>
        )}
      </div>

      <p className={styles.tip}>
        💡 Tip: Drawing specific zones (Lawn, Garden) helps our AI generate the most accurate quote for each service.
      </p>
    </div>
  );
}
