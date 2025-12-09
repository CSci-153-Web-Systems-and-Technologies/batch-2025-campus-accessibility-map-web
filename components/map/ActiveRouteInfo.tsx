'use client';

import { X, Navigation } from 'lucide-react';

interface ActiveRouteInfoProps {
  distance: number;
  hasStairs: boolean;
  onClose: () => void;
}

/** Displays active route with distance and close option */
export function ActiveRouteInfo({ distance, hasStairs, onClose }: ActiveRouteInfoProps) {
  const distanceText = distance >= 1000 
    ? `${(distance / 1000).toFixed(2)} km`
    : `${Math.round(distance)} m`;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-top">
      <div className="bg-m3-surface border border-m3-outline rounded-full shadow-lg px-4 py-2 flex items-center gap-3">
        <Navigation className="w-5 h-5 text-m3-primary" />
        <div className="flex items-center gap-2">
          <span className="font-medium text-m3-on-surface">
            Route: {distanceText}
          </span>
          {hasStairs && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-m3-error/10 text-m3-error">
              Includes stairs
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-m3-surface-variant rounded-full transition-colors"
          title="Clear route"
        >
          <X className="w-4 h-4 text-m3-on-surface" />
        </button>
      </div>
    </div>
  );
}
