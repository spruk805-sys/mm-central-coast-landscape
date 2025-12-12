"use client";

import { useLoadScript, Libraries } from "@react-google-maps/api";
import { ReactNode } from "react";

const libraries: Libraries = ["places", "drawing", "geometry"];

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  if (loadError) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Error loading Google Maps. Please check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🗺️</div>
        <p>Loading maps...</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function useGoogleMapsLoaded() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });
  return isLoaded;
}
