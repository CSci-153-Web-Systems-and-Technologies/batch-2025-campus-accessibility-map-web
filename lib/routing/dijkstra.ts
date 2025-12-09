import { RouteGraph, GraphNode } from './RouteGraph';

export interface PathResult {
  path: string[];
  distance: number;
  nodes: GraphNode[];
}

export interface TagPenalty {
  tag: string;
  multiplier: number;
}

/**
 * Finds the shortest path between two nodes using Dijkstra's algorithm.
 * Applies penalty multipliers to nodes with specific tags (e.g., stairs).
 */
export function dijkstra(
  graph: RouteGraph,
  startNodeId: string,
  endNodeId: string,
  tagPenalties: TagPenalty[] = []
): PathResult | null {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  graph.getNodes().forEach((node, nodeId) => {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
    unvisited.add(nodeId);
  });

  distances.set(startNodeId, 0);

  while (unvisited.size > 0) {
    let currentNodeId: string | null = null;
    let smallestDistance = Infinity;

    unvisited.forEach(nodeId => {
      const distance = distances.get(nodeId) ?? Infinity;
      if (distance < smallestDistance) {
        smallestDistance = distance;
        currentNodeId = nodeId;
      }
    });

    if (currentNodeId === null || smallestDistance === Infinity) {
      break;
    }

    if (currentNodeId === endNodeId) {
      break;
    }

    unvisited.delete(currentNodeId);

    const currentNode = graph.getNode(currentNodeId);
    if (!currentNode) continue;

    const neighbors = graph.getNeighbors(currentNodeId);
    
    neighbors.forEach(({ nodeId: neighborId, distance: edgeDistance }) => {
      if (!unvisited.has(neighborId)) return;

      const neighborNode = graph.getNode(neighborId);
      if (!neighborNode) return;

      let penaltyMultiplier = 1.0;
      tagPenalties.forEach(({ tag, multiplier }) => {
        if (neighborNode.tags.includes(tag)) {
          penaltyMultiplier = Math.max(penaltyMultiplier, multiplier);
        }
      });

      if (currentNodeId === null) return;
      
      const currentDistance = distances.get(currentNodeId) ?? Infinity;
      const penalizedDistance = edgeDistance * penaltyMultiplier;
      const newDistance = currentDistance + penalizedDistance;
      const existingDistance = distances.get(neighborId) ?? Infinity;

      if (newDistance < existingDistance) {
        distances.set(neighborId, newDistance);
        previous.set(neighborId, currentNodeId);
      }
    });
  }

  const finalDistance = distances.get(endNodeId) ?? Infinity;
  if (finalDistance === Infinity) {
    console.log('No path found from', startNodeId, 'to', endNodeId);
    return null;
  }

  const path: string[] = [];
  let currentId: string | null = endNodeId;

  while (currentId !== null) {
    path.unshift(currentId);
    currentId = previous.get(currentId) ?? null;
  }

  const nodes = path.map(id => graph.getNode(id)).filter((node): node is GraphNode => node !== undefined);

  return {
    path,
    distance: finalDistance,
    nodes,
  };
}

/**
 * Finds the nearest node in the graph to a given location.
 */
export function findNearestNode(graph: RouteGraph, latlng: L.LatLng): GraphNode | null {
  let nearestNode: GraphNode | null = null;
  let minDistance = Infinity;

  graph.getNodes().forEach(node => {
    const distance = node.latlng.distanceTo(latlng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestNode = node;
    }
  });

  return nearestNode;
}
