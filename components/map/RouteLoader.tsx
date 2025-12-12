'use client';

import { useEffect, RefObject } from 'react';
import { RouteGraph } from '@/lib/routing/RouteGraph';
import { fetchRoutes } from '@/lib/api/routes';
import { deserializePolyline } from '@/lib/routing/serialization';

interface RouteLoaderProps {
  graphRef: RefObject<RouteGraph | null>;
}

/** Component that loads saved routes into the graph on mount */
export function RouteLoader({ graphRef }: RouteLoaderProps) {
  useEffect(() => {
    const loadRoutes = async () => {
      if (!graphRef.current) {
        return;
      }
      const result = await fetchRoutes({ isPublic: true });
      
      if (result.error) {
        return;
      }

      const polylines = result.data?.data || result.data;

      if (!polylines || !Array.isArray(polylines) || polylines.length === 0) {
        return;
      }

      polylines.forEach(polyline => {
        const { latlngs } = deserializePolyline(polyline);
        const { nodes } = graphRef.current!.addPolyline(latlngs, polyline.id);
        
        Object.entries(polyline.node_tags || {}).forEach(([positionStr, tags]) => {
          const position = parseInt(positionStr, 10);
          if (!isNaN(position) && position < nodes.length) {
            const node = nodes[position];
            if (node && tags.hasStairs) {
              graphRef.current!.updateNodeTags(node.id, ['has_stairs']); // Use 'has_stairs' to match graph format
            }
          }
        });
      });
      graphRef.current?.printStats();
    };

    loadRoutes();
  }, [graphRef]);

  return null;
}
