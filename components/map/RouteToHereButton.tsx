'use client';

import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoutingTarget } from './RoutingTargetContext';

interface RouteToHereButtonProps {
  lat: number;
  lng: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Initiates routing from user's placement marker to a target location */
export function RouteToHereButton({ 
  lat,
  lng,
  label,
  size = 'md',
  className = '',
}: RouteToHereButtonProps) {
  const { startRouting } = useRoutingTarget();

  const handleClick = async (): Promise<void> => {
    const L = (await import('leaflet')).default;
    startRouting(L.latLng(lat, lng));
  };

  const sizeClasses = {
    sm: {
      button: 'w-8 h-8 md:w-7 md:h-7',
      icon: 'w-4 h-4',
    },
    md: {
      button: 'w-10 h-10 md:w-9 md:h-9',
      icon: 'w-5 h-5 md:w-5 md:h-5',
    },
    lg: {
      button: 'w-12 h-12 md:w-10 md:h-10',
      icon: 'w-6 h-6 md:w-5 md:h-5',
    },
  } as const;

  const sizes = sizeClasses[size];

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleClick}
      className={`${sizes.button} ${className} flex-shrink-0 rounded-full bg-m3-secondary-container hover:bg-m3-secondary-hover/20 text-m3-on-secondary-container shadow-xl border border-m3-outline transition-all hover:scale-110 touch-manipulation`}
      title={label || "Route from your location to here"}
    >
      <Navigation className={sizes.icon} />
    </Button>
  );
}
