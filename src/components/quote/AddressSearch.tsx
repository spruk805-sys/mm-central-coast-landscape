"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./AddressSearch.module.css";
import type { Coordinates } from "@/types";

interface AddressSearchProps {
  onSelect: (address: string, coordinates: Coordinates) => void;
  scriptLoaded?: boolean;
}

// Real geocoding using Google Maps API
const geocodeAddress = async (
  address: string
): Promise<{ address: string; coordinates: Coordinates } | null> => {
  if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
    return mockGeocodeAddress(address);
  }

  const geocoder = new google.maps.Geocoder();

  try {
    const response = await geocoder.geocode({ address });

    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      const location = result.geometry.location;

      return {
        address: result.formatted_address,
        coordinates: {
          lat: location.lat(),
          lng: location.lng(),
        },
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
};

// Fallback for development/offline
const mockGeocodeAddress = async (
  address: string
): Promise<{ address: string; coordinates: Coordinates } | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Santa Ynez Valley coordinates for demo
  const mockLocations: Record<string, Coordinates> = {
    solvang: { lat: 34.5958, lng: -120.1376 },
    buellton: { lat: 34.6136, lng: -120.1927 },
    "santa ynez": { lat: 34.6128, lng: -120.08 },
    "los olivos": { lat: 34.6672, lng: -120.1149 },
  };

  // Find matching area or use default
  const lowerAddress = address.toLowerCase();
  let coords = { lat: 34.5958, lng: -120.1376 }; // Default to Solvang

  for (const [area, areaCoords] of Object.entries(mockLocations)) {
    if (lowerAddress.includes(area)) {
      coords = areaCoords;
      break;
    }
  }

  // Add some randomness for unique property locations
  coords = {
    lat: coords.lat + (Math.random() - 0.5) * 0.01,
    lng: coords.lng + (Math.random() - 0.5) * 0.01,
  };

  return { address, coordinates: coords };
};
interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface LocationChoice {
  address: string;
  lat: number;
  lng: number;
  type: string;
}

export default function AddressSearch({
  onSelect,
  scriptLoaded = false,
}: AddressSearchProps) {
  const [address, setAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationChoices, setLocationChoices] = useState<LocationChoice[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Places services
  useEffect(() => {
    if (scriptLoaded && window.google?.maps) {
      try {
        const geocoderAvailable = !!window.google.maps.Geocoder;
        const placesAvailable = !!window.google.maps.places;

        if (placesAvailable) {
          autocompleteService.current =
            new google.maps.places.AutocompleteService();
          // Create a dummy map element for PlacesService
          const mapDiv = document.createElement("div");
          const dummyMap = new google.maps.Map(mapDiv, {
            center: { lat: 0, lng: 0 },
            zoom: 1,
          });
          placesService.current = new google.maps.places.PlacesService(
            dummyMap
          );
        } else if (geocoderAvailable) {
        } else {
        }
      } catch (err) {
        console.error("[AddressSearch] Error initializing Google APIs:", err);
      }
    } else if (!scriptLoaded) {
    }
  }, [scriptLoaded]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 3) {
      setSuggestions([]);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "us" },
        types: ["address"],
        // Bias results towards Santa Ynez Valley area
        location: new google.maps.LatLng(34.6, -120.1),
        radius: 50000, // 50km radius
      },
      (predictions, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          setSuggestions(
            predictions.slice(0, 5).map((p) => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.structured_formatting.main_text,
              secondaryText: p.structured_formatting.secondary_text,
            }))
          );
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      }
    );
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    setError("");

    // Debounce autocomplete requests
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionClick = async (suggestion: Suggestion) => {
    setAddress(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsSearching(true);
    setError("");

    try {
      // Use Places API to get detailed place info including coordinates
      if (placesService.current) {
        placesService.current.getDetails(
          {
            placeId: suggestion.placeId,
            fields: ["geometry", "formatted_address"],
          },
          (place, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              place?.geometry?.location
            ) {
              onSelect(place.formatted_address || suggestion.description, {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });
            } else {
              // Fallback to geocoding
              geocodeAddress(suggestion.description).then((result) => {
                if (result) {
                  onSelect(result.address, result.coordinates);
                } else {
                  setError("Could not find that address. Please try again.");
                }
              });
            }
            setIsSearching(false);
          }
        );
      } else {
        // Fallback to geocoding if Places service not available
        const result = await geocodeAddress(suggestion.description);
        if (result) {
          onSelect(result.address, result.coordinates);
        } else {
          setError("Could not find that address. Please try again.");
        }
        setIsSearching(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    setShowSuggestions(false);
    setIsSearching(true);
    setError("");

    try {
      const result = await geocodeAddress(address);
      if (result) {
        onSelect(result.address, result.coordinates);
      } else {
        setError("Could not find that address. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Use browser geolocation to find current location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    if (!window.isSecureContext) {
      setError(
        "Location services require a secure connection (HTTPS) on mobile devices. Please use a secure tunnel or HTTPS."
      );
      return;
    }

    setIsLocating(true);
    setError("");
    setLocationChoices([]);
    console.log("[Location] Requesting geolocation...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const accuracy = position.coords.accuracy; // in meters
        console.log(
          "[Location] Got coordinates:",
          latitude,
          longitude,
          "accuracy:",
          accuracy,
          "m"
        );

        try {
          // Reverse geocode to get address - only if Google Maps script is loaded
          if (scriptLoaded && window.google?.maps?.Geocoder) {
            const geocoder = new google.maps.Geocoder();

            geocoder.geocode(
              { location: { lat: latitude, lng: longitude } },
              (results, status) => {
                if (status === "OK" && results && results.length > 0) {
                  // If accuracy is poor (>50m) or multiple street-level results, show choices
                  const streetAddresses = results.filter(
                    (r) =>
                      r.types.includes("street_address") ||
                      r.types.includes("premise") ||
                      r.types.includes("subpremise")
                  );

                  // Show choices if accuracy > 30m or we have multiple street addresses
                  if (accuracy > 30 || streetAddresses.length > 1) {
                    // Get up to 5 unique addresses
                    const uniqueAddresses = new Map<string, LocationChoice>();
                    results.slice(0, 8).forEach((r) => {
                      if (!uniqueAddresses.has(r.formatted_address)) {
                        const loc = r.geometry.location;
                        uniqueAddresses.set(r.formatted_address, {
                          address: r.formatted_address,
                          lat: loc.lat(),
                          lng: loc.lng(),
                          type: r.types[0] || "address",
                        });
                      }
                    });

                    const choices = Array.from(uniqueAddresses.values()).slice(
                      0,
                      5
                    );

                    if (choices.length > 1) {
                      setLocationChoices(choices);
                      setIsLocating(false);
                      return;
                    }
                  }

                  // High precision - use first result directly
                  const formattedAddress = results[0].formatted_address;
                  setAddress(formattedAddress);
                  onSelect(formattedAddress, { lat: latitude, lng: longitude });
                } else {
                  console.log("[Location] Geocode failed, using coordinates");
                  const coordAddress = `${latitude.toFixed(
                    6
                  )}, ${longitude.toFixed(6)}`;
                  setAddress(coordAddress);
                  onSelect(coordAddress, { lat: latitude, lng: longitude });
                }
                setIsLocating(false);
              }
            );
          } else {
            // Fallback if geocoder not available
            console.log("[Location] Geocoder not available, using coordinates");
            const coordAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(
              6
            )}`;
            setAddress(coordAddress);
            onSelect(coordAddress, { lat: latitude, lng: longitude });
            setIsLocating(false);
          }
        } catch (err) {
          console.error("[Location] Reverse geocoding error:", err);
          // Still proceed with coordinates even if reverse geocoding fails
          const coordAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(
            6
          )}`;
          setAddress(coordAddress);
          onSelect(coordAddress, { lat: latitude, lng: longitude });
          setIsLocating(false);
        }
      },
      (err) => {
        console.error("[Location] Geolocation error:", err);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(
              "Location access denied. Please enable location services in your browser settings."
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setError(
              "Location unavailable. Please try again or enter your address manually."
            );
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError(
              "Unable to get your location. Please enter your address manually."
            );
        }
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  const handleSampleAddress = () => {
    const sampleAddresses = [
      "123 Copenhagen Drive, Solvang, CA 93463",
      "456 Mission Drive, Buellton, CA 93427",
      "789 Refugio Road, Santa Ynez, CA 93460",
      "321 Grand Avenue, Los Olivos, CA 93441",
    ];
    const randomAddress =
      sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)];
    setAddress(randomAddress);
    setShowSuggestions(false);
  };

  return (
    <div className={styles.addressSearch}>
      <div className={styles.searchContainer}>
        {/* Junk Removal Cross-Promo */}
        <div className={styles.junkPromo}>
          <span className={styles.promoIcon}>🚛</span>
          <div className={styles.promoText}>
            <strong>Need Junk Removal?</strong> Use our specialized Photo-AI Estimator instead.
          </div>
          <Link href="/dump-quote" className={styles.promoLink}>
            Try Junk Removal AI →
          </Link>
        </div>

        <div className={styles.searchHeader}>
          <span className={styles.icon}>📍</span>
        </div>
        <h2 className={styles.title}>Where is your property located?</h2>
        <p className={styles.description}>
          Enter your property address to get started with your personalized
          quote
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={handleInputChange}
            onFocus={() =>
              address.length >= 3 &&
              suggestions.length > 0 &&
              setShowSuggestions(true)
            }
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Start typing an address..."
            className={styles.input}
            disabled={isSearching}
            autoComplete="off"
          />
          {address && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setAddress("");
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              aria-label="Clear address"
            >
              ×
            </button>
          )}

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.placeId}
                  type="button"
                  className={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="16"
                    height="16"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className={styles.suggestionText}>
                    <span className={styles.suggestionMain}>
                      {suggestion.mainText}
                    </span>
                    <span className={styles.suggestionSecondary}>
                      {suggestion.secondaryText}
                    </span>
                  </div>
                </button>
              ))}
              <div className={styles.poweredBy}>
                <svg viewBox="0 0 516 107" width="60" height="14">
                  <path
                    fill="#4285F4"
                    d="M42.1 71.1c-11.4 0-21-9.6-21-22.3s9.6-22.3 21-22.3c6.3 0 10.8 2.5 14.2 5.7l4.9-4.9C57 23.2 50.4 20 42.1 20c-15.4 0-28.3 12.5-28.3 28.8s12.9 28.8 28.3 28.8c8.3 0 14.6-2.7 19.5-7.8 5-5.2 6.6-12.4 6.6-18.3 0-1.8-.2-3.5-.4-4.9H42.1v6.6h23.1c-.3 3.7-1.1 6.6-2.4 9C60 66.6 52.4 71.1 42.1 71.1z"
                  />
                  <path
                    fill="#EA4335"
                    d="M129.1 48.3c0 15.4-11.4 26.8-25.4 26.8-14 0-25.4-11.3-25.4-26.8 0-15.6 11.4-26.8 25.4-26.8 14 0 25.4 11.2 25.4 26.8zm-11.1 0c0-9.6-7-16.2-14.4-16.2-7.4 0-14.4 6.6-14.4 16.2 0 9.6 7 16.2 14.4 16.2 7.5 0 14.4-6.6 14.4-16.2z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M178.1 48.3c0 15.4-11.4 26.8-25.4 26.8-14 0-25.4-11.3-25.4-26.8 0-15.6 11.4-26.8 25.4-26.8 14 0 25.4 11.2 25.4 26.8zm-11.1 0c0-9.6-7-16.2-14.4-16.2-7.4 0-14.4 6.6-14.4 16.2 0 9.6 7 16.2 14.4 16.2 7.5 0 14.4-6.6 14.4-16.2z"
                  />
                  <path
                    fill="#4285F4"
                    d="M225.4 22.8v48.8c0 20.1-11.9 28.3-25.9 28.3-13.2 0-21.1-8.8-24.1-16l9.7-4c1.8 4.4 6.3 9.6 14.3 9.6 9.4 0 15.2-5.8 15.2-16.7v-4.1h-.4c-2.8 3.5-8.2 6.5-15 6.5-14.2 0-27.2-12.4-27.2-28.3 0-16.1 13-26.8 27.2-26.8 6.8 0 12.2 3 15 6.4h.4v-4.7h10.8zm-10 25.5c0-9.4-6.3-16.3-14.3-16.3-8.1 0-14.9 6.9-14.9 16.3 0 9.4 6.8 16.1 14.9 16.1 8 0 14.3-6.7 14.3-16.1z"
                  />
                  <path fill="#34A853" d="M243.1 2v72.4h-10.9V2h10.9z" />
                  <path
                    fill="#EA4335"
                    d="M294.3 59.6l8.5 5.7c-2.7 4.1-9.4 11.1-20.8 11.1-14.2 0-24.8-11-24.8-26.8 0-15.9 10.7-26.8 23.6-26.8 12.9 0 19.3 10.3 21.4 15.9l1.1 2.8-33.5 13.9c2.6 5 6.6 7.6 12.2 7.6 5.7 0 9.6-2.8 12.3-7.4zm-26.3-9.6l22.4-9.3c-1.2-3.1-4.9-5.3-9.3-5.3-5.5 0-13.2 4.9-13.1 14.6z"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {/* Location Choices - show when multiple results found */}
        {locationChoices.length > 0 && (
          <div className={styles.locationChoices}>
            <h3 className={styles.choicesTitle}>
              📍 Which address is correct?
            </h3>
            <p className={styles.choicesSubtitle}>
              We found multiple possible addresses. Please select the most
              accurate one:
            </p>
            <div className={styles.choicesList}>
              {locationChoices.map((choice, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.choiceBtn}
                  onClick={() => {
                    setAddress(choice.address);
                    setLocationChoices([]);
                    onSelect(choice.address, {
                      lat: choice.lat,
                      lng: choice.lng,
                    });
                  }}
                >
                  <span className={styles.choiceIcon}>
                    {choice.type === "street_address"
                      ? "🏠"
                      : choice.type === "premise"
                      ? "🏢"
                      : choice.type === "route"
                      ? "🛣️"
                      : "📍"}
                  </span>
                  <span className={styles.choiceAddress}>{choice.address}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.cancelChoices}
              onClick={() => setLocationChoices([])}
            >
              Cancel - Enter manually instead
            </button>
          </div>
        )}

        <button
          type="submit"
          className={`btn btn-primary btn-lg ${styles.submitBtn}`}
          disabled={isSearching || isLocating}
        >
          {isSearching ? (
            <>
              <span className={styles.spinner}></span>
              Looking up address...
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="20"
                height="20"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Find My Property
            </>
          )}
        </button>
      </form>

      {/* Use My Location Button */}
      <button
        type="button"
        className={styles.locationBtn}
        onClick={handleUseMyLocation}
        disabled={isLocating || isSearching}
      >
        {isLocating ? (
          <>
            <span className={styles.spinner}></span>
            Finding your location...
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="20"
              height="20"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
            Use My Current Location
          </>
        )}
      </button>

      <div className={styles.divider}>
        <span>or try a sample address</span>
      </div>

      <button
        type="button"
        className={styles.sampleBtn}
        onClick={handleSampleAddress}
      >
        🏡 Use Sample Santa Ynez Valley Address
      </button>

      <div className={styles.serviceAreas}>
        <h3 className={styles.areasTitle}>We serve:</h3>
        <div className={styles.areasTags}>
          {["Solvang", "Buellton", "Santa Ynez", "Los Olivos", "Ballard"].map(
            (area) => (
              <span key={area} className={styles.areaTag}>
                {area}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
