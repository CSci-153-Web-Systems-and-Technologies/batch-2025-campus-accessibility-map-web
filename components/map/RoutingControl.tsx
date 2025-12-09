'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { RouteGraph } from '@/lib/routing/RouteGraph';
import { dijkstra, findNearestNode } from '@/lib/routing/dijkstra';

interface RoutingControlProps {
  graphRef: React.RefObject<RouteGraph | null>;
  isSettingLocation: boolean;
  onLocationSet?: (latlng: L.LatLng) => void;
  targetNodeId: string | null;
  targetLocation: { lat: number; lng: number } | null;
  onRouteCalculated?: (distance?: number, hasStairs?: boolean) => void;
}

/** Handles user location placement and route calculation */
export function RoutingControl({ 
  graphRef, 
  isSettingLocation, 
  onLocationSet,
  targetNodeId,
  targetLocation,
  onRouteCalculated
}: RoutingControlProps) {
  const map = useMap();
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (!isSettingLocation) return;

    const handleMapClick = (e: L.LeafletMouseEvent): void => {
      setUserLocation(e.latlng);
      onLocationSet?.(e.latlng);

      if (userLocationMarkerRef.current) {
        map.removeLayer(userLocationMarkerRef.current);
      }

      const icon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="width: 24px; height: 24px; background-color: hsl(var(--m3-primary)); border: 4px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(e.latlng, { icon }).addTo(map);
      userLocationMarkerRef.current = marker;
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isSettingLocation, map, onLocationSet]);

  useEffect(() => {
    if (!targetNodeId && !targetLocation) {
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      return;
    }

    if (!userLocation || !graphRef.current) return;

    let finalTargetNodeId = targetNodeId;
    
    if (!finalTargetNodeId && targetLocation) {
      const targetLatLng = L.latLng(targetLocation.lat, targetLocation.lng);
      const targetNode = findNearestNode(graphRef.current, targetLatLng);
      if (targetNode) {
        finalTargetNodeId = targetNode.id;
      }
    }

    if (!finalTargetNodeId) return;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const startNode = findNearestNode(graphRef.current, userLocation);
    if (!startNode) {
      console.error('Could not find nearest node to user location');
      return;
    }
    
    const result = dijkstra(graphRef.current, startNode.id, finalTargetNodeId, [
      { tag: 'has_stairs', multiplier: 10.0 }
    ]);
    
    if (!result) {
      console.error('No route found');
      alert('No accessible route found to this location');
      return;
    }

    const hasStairs = result.nodes.some(node => node.tags.includes('has_stairs'));
    if (hasStairs) {
      alert('⚠️ This route includes stairs. No stair-free path was found.');
    }

    const routeCoords = [userLocation, ...result.nodes.map(node => node.latlng)];
    
    const routeLine = L.polyline(routeCoords, {
      color: 'hsl(var(--m3-tertiary))',
      weight: 6,
      opacity: 0.8,
      dashArray: '10, 10',
    }).addTo(map);

    routeLineRef.current = routeLine;

    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    let totalDistance = 0;
    for (let i = 0; i < routeCoords.length - 1; i++) {
      totalDistance += routeCoords[i].distanceTo(routeCoords[i + 1]);
    }

    onRouteCalculated?.(totalDistance, hasStairs);
  }, [userLocation, targetNodeId, targetLocation, graphRef, map]);

  useEffect(() => {
    return () => {
      if (userLocationMarkerRef.current) {
        map.removeLayer(userLocationMarkerRef.current);
      }
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
      }
    };
  }, [map]);

  return null;
}
