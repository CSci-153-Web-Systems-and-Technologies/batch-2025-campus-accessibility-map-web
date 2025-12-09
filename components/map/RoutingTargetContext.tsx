'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type L from 'leaflet';

interface RoutingContextType {
  targetLocation: L.LatLng | null;
  setTargetLocation: (location: L.LatLng | null) => void;
  startRouting: (location: L.LatLng) => void;
}

interface RoutingProviderProps {
  children: ReactNode;
  onRouteRequest: (location: L.LatLng) => void;
}

const RoutingContext = createContext<RoutingContextType | undefined>(undefined);

/** Provides routing state and initiates route calculation */
export function RoutingProvider({ children, onRouteRequest }: RoutingProviderProps) {
  const [targetLocation, setTargetLocation] = useState<L.LatLng | null>(null);

  const startRouting = (location: L.LatLng): void => {
    setTargetLocation(location);
    onRouteRequest(location);
  };

  return (
    <RoutingContext.Provider value={{ targetLocation, setTargetLocation, startRouting }}>
      {children}
    </RoutingContext.Provider>
  );
}

export function useRoutingTarget(): RoutingContextType {
  const context = useContext(RoutingContext);
  if (context === undefined) {
    throw new Error('useRoutingTarget must be used within a RoutingProvider');
  }
  return context;
}
