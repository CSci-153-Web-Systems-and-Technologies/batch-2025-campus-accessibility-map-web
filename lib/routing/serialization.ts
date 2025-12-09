import L from 'leaflet';
import type { RoutePolyline, RoutePolylineInsert, NodeTags } from '@/types/database';
import type { GraphNode } from './RouteGraph';

export interface SerializedPolyline {
  id: string;
  coordinates: number[][];
  nodeTags: Record<string, NodeTags>;
}

/** Convert Leaflet LatLng array to coordinates array for database */
export function serializePolyline(
  latlngs: L.LatLng[],
  polylineId: string,
  nodeTagsMap: Map<string, string[]>
): SerializedPolyline {
  const coordinates = latlngs.map(ll => [ll.lat, ll.lng]);
  
  const nodeTags: Record<string, NodeTags> = {};
  nodeTagsMap.forEach((tags, nodeId) => {
    nodeTags[nodeId] = {
      hasStairs: tags.includes('hasStairs'),
    };
  });

  return {
    id: polylineId,
    coordinates,
    nodeTags,
  };
}

/** Convert database RoutePolyline to Leaflet LatLng array */
export function deserializePolyline(polyline: RoutePolyline): {
  latlngs: L.LatLng[];
  nodeTags: Map<string, string[]>;
  polylineId: string;
} {
  const latlngs = polyline.coordinates.map(([lat, lng]) => L.latLng(lat, lng));
  
  const nodeTags = new Map<string, string[]>();
  Object.entries(polyline.node_tags || {}).forEach(([nodeId, tags]) => {
    const tagArray: string[] = [];
    if (tags.hasStairs) {
      tagArray.push('hasStairs');
    }
    if (tagArray.length > 0) {
      nodeTags.set(nodeId, tagArray);
    }
  });

  return {
    latlngs,
    nodeTags,
    polylineId: polyline.id,
  };
}

/** Convert serialized polylines to RoutePolylineInsert for database */
export function toPolylineInsert(
  serialized: SerializedPolyline,
  isPublic: boolean = true,
  name?: string,
  description?: string
): Omit<RoutePolylineInsert, 'created_by'> & { id?: string } {
  return {
    id: serialized.id,
    coordinates: serialized.coordinates,
    node_tags: serialized.nodeTags,
    is_public: isPublic,
    name: name || null,
    description: description || null,
  };
}

/** Build node tags map from RouteGraph nodes */
export function buildNodeTagsMap(nodes: Map<string, GraphNode>): Map<string, string[]> {
  const nodeTagsMap = new Map<string, string[]>();
  
  nodes.forEach((node, nodeId) => {
    if (node.tags.length > 0) {
      nodeTagsMap.set(nodeId, [...node.tags]);
    }
  });
  
  return nodeTagsMap;
}
