'use client';

import L from 'leaflet';

export interface RouteNode {
  id: string;
  lat: number;
  lng: number;
  tags: string[];
}

export interface RouteEdge {
  source: string; // node id
  target: string; // node id
  weight: number; // distance in meters
}

export interface RouteGraph {
  nodes: RouteNode[];
  edges: RouteEdge[];
}

/**
 * Calculate distance between two lat/lng points in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const point1 = L.latLng(lat1, lng1);
  const point2 = L.latLng(lat2, lng2);
  return point1.distanceTo(point2);
}

/**
 * Check if two coordinates are close enough to be the same node
 */
export function areCoordinatesClose(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  threshold = 5 // meters
): boolean {
  return calculateDistance(lat1, lng1, lat2, lng2) <= threshold;
}

/**
 * Find existing node at given coordinates, or return undefined
 */
export function findNodeAtCoordinates(
  nodes: RouteNode[],
  lat: number,
  lng: number,
  threshold = 5
): RouteNode | undefined {
  return nodes.find((node) =>
    areCoordinatesClose(node.lat, node.lng, lat, lng, threshold)
  );
}

/**
 * Generate unique node ID
 */
export function generateNodeId(lat: number, lng: number): string {
  return `node-${lat.toFixed(6)}-${lng.toFixed(6)}`;
}

/**
 * Convert polylines to graph structure
 */
export function polylinesToGraph(polylines: L.Polyline[]): RouteGraph {
  const nodes: RouteNode[] = [];
  const edges: RouteEdge[] = [];

  polylines.forEach((polyline) => {
    const latlngs = polyline.getLatLngs() as L.LatLng[];

    // Process each vertex in the polyline
    for (let i = 0; i < latlngs.length; i++) {
      const latlng = latlngs[i];
      const lat = latlng.lat;
      const lng = latlng.lng;

      // Check if node already exists (deduplication)
      let currentNode = findNodeAtCoordinates(nodes, lat, lng);

      if (!currentNode) {
        // Create new node
        currentNode = {
          id: generateNodeId(lat, lng),
          lat,
          lng,
          tags: [],
        };
        nodes.push(currentNode);
      }

      // Create edge to next vertex
      if (i < latlngs.length - 1) {
        const nextLatlng = latlngs[i + 1];
        const nextLat = nextLatlng.lat;
        const nextLng = nextLatlng.lng;

        // Find or create next node
        let nextNode = findNodeAtCoordinates(nodes, nextLat, nextLng);

        if (!nextNode) {
          nextNode = {
            id: generateNodeId(nextLat, nextLng),
            lat: nextLat,
            lng: nextLng,
            tags: [],
          };
          nodes.push(nextNode);
        }

        // Create edge
        const weight = calculateDistance(lat, lng, nextLat, nextLng);
        
        // Avoid duplicate edges
        const edgeExists = edges.some(
          (e) =>
            (e.source === currentNode!.id && e.target === nextNode!.id) ||
            (e.source === nextNode!.id && e.target === currentNode!.id)
        );

        if (!edgeExists) {
          edges.push({
            source: currentNode.id,
            target: nextNode.id,
            weight,
          });
        }
      }
    }
  });

  return { nodes, edges };
}

/**
 * Display graph info in console
 */
export function logGraph(graph: RouteGraph) {
  console.log('📊 Route Graph Generated:');
  console.log(`   Nodes: ${graph.nodes.length}`);
  console.log(`   Edges: ${graph.edges.length}`);
  console.log('');
  console.log('🔵 Nodes:', graph.nodes);
  console.log('🔗 Edges:', graph.edges);
  
  // Show connections
  const connections: Record<string, string[]> = {};
  graph.edges.forEach(edge => {
    if (!connections[edge.source]) connections[edge.source] = [];
    if (!connections[edge.target]) connections[edge.target] = [];
    connections[edge.source].push(edge.target);
    connections[edge.target].push(edge.source);
  });
  console.log('🌐 Connections:', connections);
}
