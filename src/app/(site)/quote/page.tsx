"use client";

import { useState, useCallback } from "react";
import { useLoadScript, Libraries } from "@react-google-maps/api";
import styles from "./page.module.css";
import AddressSearch from "@/components/quote/AddressSearch";
import AIAnalysis from "@/components/quote/AIAnalysis";
import PropertyMap from "@/components/quote/PropertyMap";
import PropertyDetails from "@/components/quote/PropertyDetails";
import ServiceSelector from "@/components/quote/ServiceSelector";
import QuoteResult from "@/components/quote/QuoteResult";
import dynamic from "next/dynamic";
import type { QuoteInput, QuoteResult as QuoteResultType, PropertyZone, Coordinates } from "@/types";

// Dynamically import Google Maps component to avoid SSR issues
const GooglePropertyMap = dynamic(
  () => import("@/components/maps/GooglePropertyMap"),
  { 
    ssr: false,
    loading: () => (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🗺️</div>
        <p>Loading Google Maps...</p>
      </div>
    ),
  }
);

type QuoteStep = 'address' | 'ai-analysis' | 'map' | 'details' | 'services' | 'result';

const steps: { id: QuoteStep; label: string; icon: string }[] = [
  { id: 'address', label: 'Address', icon: '📍' },
  { id: 'ai-analysis', label: 'AI Scan', icon: '🤖' },
  { id: 'map', label: 'Refine', icon: '🗺️' },
  { id: 'details', label: 'Details', icon: '📋' },
  { id: 'services', label: 'Services', icon: '🌿' },
  { id: 'result', label: 'Quote', icon: '💰' },
];

const libraries: Libraries = ["places", "drawing", "geometry"];

export default function QuotePage() {
  const [currentStep, setCurrentStep] = useState<QuoteStep>('address');
  const [quoteData, setQuoteData] = useState<Partial<QuoteInput>>({
    treeCount: 0,
    bushCount: 0,
    hasPool: false,
    hasFence: false,
    services: [],
    frequency: 'one-time',
  });
  const [quoteResult, setQuoteResult] = useState<QuoteResultType | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);

  // Load Google Maps
  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const hasGoogleMapsKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleAddressSelect = useCallback((address: string, coordinates: Coordinates) => {
    setQuoteData(prev => ({
      ...prev,
      address,
      lat: coordinates.lat,
      lng: coordinates.lng,
    }));
    setCurrentStep('ai-analysis');
  }, []);

  // Handle AI Analysis completion - auto-populate property details
  const handleAIAnalysisComplete = useCallback((analysis: {
    lawnSqft: number;
    treeCount: number;
    bushCount: number;
    hasPool: boolean;
    hasFence: boolean;
    gardenBeds: number;
  }) => {
    setQuoteData(prev => ({
      ...prev,
      totalSqft: analysis.lawnSqft + (analysis.gardenBeds * 50), // Estimate total
      lawnSqft: analysis.lawnSqft,
      bedsSqft: analysis.gardenBeds * 50, // Estimate garden bed size
      treeCount: analysis.treeCount,
      bushCount: analysis.bushCount,
      hasPool: analysis.hasPool,
      hasFence: analysis.hasFence,
    }));
    // Skip map step and go directly to details for refinement
    setCurrentStep('details');
  }, []);

  // Skip AI analysis and use manual map drawing
  const handleSkipAIAnalysis = useCallback(() => {
    setCurrentStep('map');
  }, []);

  const handlePolygonComplete = useCallback((zones: PropertyZone[], totalArea: number) => {
    // Calculate areas based on AI zoning
    const lawnArea = zones.filter(z => z.type === 'lawn').reduce((sum, z) => sum + z.area, 0);
    const gardenArea = zones.filter(z => z.type === 'garden').reduce((sum, z) => sum + z.area, 0);
    
    // If we have manual entry (mock zone) or generic zones, default to estimates if no specific lawn/garden zones defined
    // But if user explicitly drew zones, trust those.
    // Logic: if total lawn+garden > 0, use that. If 0 (user only drew 'other' or manual), use estimates.
    
    let lawnSqft = lawnArea;
    let bedsSqft = gardenArea;

    // Fallback for manual entry or if user didn't label specific zones
    if (lawnSqft === 0 && bedsSqft === 0 && totalArea > 0) {
        lawnSqft = Math.round(totalArea * 0.7);
        bedsSqft = Math.round(totalArea * 0.15);
    }

    setQuoteData(prev => ({
      ...prev,
      totalSqft: totalArea,
      lawnSqft,
      bedsSqft,
    }));
    setCurrentStep('details');
  }, []);

  const handleDetailsSubmit = useCallback((details: Partial<QuoteInput>) => {
    setQuoteData(prev => {
      // Smart Service Recommendations
      // Based on the data collected (Map zones + Details), we recommend services
      const recommendedServices = [...(prev.services || [])];
      
      const addService = (id: string) => {
        if (!recommendedServices.includes(id)) recommendedServices.push(id);
      };

      if ((prev.lawnSqft || 0) > 100) addService('lawn-maintenance');
      if ((prev.bedsSqft || 0) > 50) addService('garden-design');
      if ((details.treeCount || 0) > 0) addService('tree-trimming');
      if ((details.bushCount || 0) > 0) addService('bush-trimming');
      if (details.hasFence) addService('fence-repair');

      return {
        ...prev,
        ...details,
        services: recommendedServices,
      };
    });
    setCurrentStep('services');
  }, []);

  // Quote calculation function - defined before handleServicesSubmit
  const calculateLocalQuote = (data: QuoteInput): QuoteResultType => {
    const breakdown: QuoteResultType['breakdown'] = [];
    let total = 0;

    // Base rates per service type
    const rates = {
      'lawn-maintenance': { rate: 0.015, unit: 'sqft', name: 'Lawn Maintenance' },
      'tree-trimming': { rate: 45, unit: 'tree', name: 'Tree Trimming' },
      'bush-trimming': { rate: 15, unit: 'bush', name: 'Bush/Shrub Trimming' },
      'sprinkler-repair': { rate: 85, unit: 'flat', name: 'Sprinkler Inspection' },
      'garden-design': { rate: 0.03, unit: 'sqft', name: 'Garden Bed Maintenance' },
      'fence-repair': { rate: 150, unit: 'flat', name: 'Fence Inspection/Minor Repair' },
      'cleanup': { rate: 75, unit: 'flat', name: 'Yard Cleanup' },
      'trashcaddy': { rate: 10, unit: 'flat', name: 'TrashCaddy - To Curb Only' },
      'trashcaddy-return': { rate: 15, unit: 'flat', name: 'TrashCaddy - Full Service (Curb & Return)' },
      'hardscaping': { rate: 150, unit: 'flat', name: 'Hardscaping Consultation' },
      'sod-installation': { rate: 2.50, unit: 'sqft', name: 'Sod Installation' },
    };

    data.services.forEach(serviceId => {
      const service = rates[serviceId as keyof typeof rates];
      if (!service) return;

      let quantity = 1;
      let subtotal = 0;

      switch (service.unit) {
        case 'sqft':
          if (serviceId === 'lawn-maintenance' || serviceId === 'sod-installation') {
            quantity = data.lawnSqft || data.totalSqft * 0.7;
          } else if (serviceId === 'garden-design') {
            quantity = data.bedsSqft || data.totalSqft * 0.15;
          }
          subtotal = quantity * service.rate;
          break;
        case 'tree':
          quantity = data.treeCount || 0;
          subtotal = quantity * service.rate;
          break;
        case 'bush':
          quantity = data.bushCount || 0;
          subtotal = quantity * service.rate;
          break;
        case 'flat':
          subtotal = service.rate;
          break;
      }

      if (subtotal > 0) {
        breakdown.push({
          serviceId,
          serviceName: service.name,
          quantity,
          unit: service.unit,
          rate: service.rate,
          subtotal,
        });
        total += subtotal;
      }
    });

    // Apply frequency discount
    const frequencyMultiplier = {
      'one-time': 1,
      'monthly': 0.95,
      'bi-weekly': 0.90,
      'weekly': 0.85,
    };

    const discount = 1 - (frequencyMultiplier[data.frequency || 'one-time'] || 1);
    if (discount > 0) {
      const discountAmount = total * discount;
      breakdown.push({
        serviceId: 'frequency-discount',
        serviceName: `${data.frequency?.replace('-', ' ')} Service Discount`,
        quantity: 1,
        unit: 'discount',
        rate: -discount * 100,
        subtotal: -discountAmount,
      });
      total -= discountAmount;
    }

    // Pool surcharge
    if (data.hasPool) {
      const poolSurcharge = 25;
      breakdown.push({
        serviceId: 'pool-surcharge',
        serviceName: 'Pool Area Navigation',
        quantity: 1,
        unit: 'flat',
        rate: poolSurcharge,
        subtotal: poolSurcharge,
      });
      total += poolSurcharge;
    }

    return {
      estimatedTotal: Math.round(total * 100) / 100,
      breakdown,
      confidenceScore: 0.85,
      notes: [
        'Estimate based on property measurements',
        'Final price may vary based on on-site assessment',
        'Free on-site consultation available',
      ],
    };
  };

  const handleServicesSubmit = useCallback((services: string[], frequency: QuoteInput['frequency']) => {
    const updatedData = {
      ...quoteData,
      services,
      frequency,
    };
    setQuoteData(updatedData);
    
    // Calculate quote
    setIsCalculating(true);
    setCurrentStep('result');
    
    setTimeout(() => {
      const result = calculateLocalQuote(updatedData as QuoteInput);
      setQuoteResult(result);
      setIsCalculating(false);
    }, 1500);
  }, [quoteData]);

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const startOver = () => {
    setCurrentStep('address');
    setQuoteData({
      treeCount: 0,
      bushCount: 0,
      hasPool: false,
      hasFence: false,
      services: [],
      frequency: 'one-time',
    });
    setQuoteResult(null);
  };

  // Determine which map component to use
  const showGoogleMaps = hasGoogleMapsKey && mapsLoaded && useGoogleMaps;

  return (
    <div className={styles.quotePage}>
      {/* Header */}
      <div className={styles.quoteHeader}>
        <div className="container">
          <h1 className={styles.quoteTitle}>Get Your Free Quote</h1>
          <p className={styles.quoteSubtitle}>
            Use our AI-powered estimator to get an instant quote for your property
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className={styles.progressContainer}>
        <div className="container">
          <div className={styles.progressTrack}>
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`${styles.progressStep} ${
                  index < currentStepIndex ? styles.completed : ''
                } ${index === currentStepIndex ? styles.active : ''}`}
              >
                <div className={styles.stepIcon}>
                  {index < currentStepIndex ? '✓' : step.icon}
                </div>
                <span className={styles.stepLabel}>{step.label}</span>
                {index < steps.length - 1 && <div className={styles.stepConnector} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.quoteContent}>
        <div className="container">
          <div className={styles.quoteCard}>
            {/* Step 1: Address Search */}
            {currentStep === 'address' && (
              <AddressSearch 
                onSelect={handleAddressSelect} 
                scriptLoaded={mapsLoaded}
              />
            )}

            {/* Step 2: AI Property Analysis */}
            {currentStep === 'ai-analysis' && quoteData.lat && quoteData.lng && (
              <AIAnalysis
                coordinates={{ lat: quoteData.lat, lng: quoteData.lng }}
                address={quoteData.address || ''}
                onAnalysisComplete={handleAIAnalysisComplete}
                onSkip={handleSkipAIAnalysis}
              />
            )}

            {/* Step 3: Property Map (optional refinement) */}
            {currentStep === 'map' && quoteData.lat && quoteData.lng && (
              <>
                {showGoogleMaps ? (
                  <GooglePropertyMap
                    center={{ lat: quoteData.lat, lng: quoteData.lng }}
                    address={quoteData.address || ''}
                    onPolygonComplete={handlePolygonComplete}
                    onBack={goBack}
                  />
                ) : (
                  <PropertyMap
                    center={{ lat: quoteData.lat, lng: quoteData.lng }}
                    address={quoteData.address || ''}
                    onPolygonComplete={handlePolygonComplete}
                    onBack={goBack}
                  />
                )}
                {hasGoogleMapsKey && (
                  <div className={styles.mapToggle}>
                    <button 
                      onClick={() => setUseGoogleMaps(!useGoogleMaps)}
                      className={styles.toggleBtn}
                    >
                      {useGoogleMaps ? '📐 Use Manual Entry Instead' : '🗺️ Use Google Maps'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Step 3: Property Details */}
            {currentStep === 'details' && (
              <PropertyDetails
                initialData={quoteData}
                onSubmit={handleDetailsSubmit}
                onBack={goBack}
              />
            )}

            {/* Step 4: Service Selection */}
            {currentStep === 'services' && (
              <ServiceSelector
                selectedServices={quoteData.services || []}
                frequency={quoteData.frequency}
                onSubmit={handleServicesSubmit}
                onBack={goBack}
              />
            )}

            {/* Step 5: Quote Result */}
            {currentStep === 'result' && (
              <QuoteResult
                result={quoteResult}
                isCalculating={isCalculating}
                propertyData={quoteData}
                onStartOver={startOver}
                onBook={() => {
                  // Navigate to booking page
                  window.location.href = '/book';
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
