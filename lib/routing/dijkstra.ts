import { RouteGraph, RouteNode, RouteEdge } from './graph-utils';

interface DijkstraResult {
  path: string[]; // Array of node IDs
  distance: number; // Total distance in meters
  nodes: RouteNode[]; // Full node objects in path
}

/**
 * Dijkstra's algorithm with tag filtering
 * 
 * @param graph - The route graph
 * @param startNodeId - Starting node ID
 * @param endNodeId - Ending node ID
 * @param avoidTags - Array of tags to avoid (e.g., ['has_stairs'])
 * @returns Path from start to end, or null if no path exists
 */
export function findPath(
  graph: RouteGraph,
  startNodeId: string,
  endNodeId: string,
  avoidTags: string[] = []
): DijkstraResult | null {
  // Filter out nodes with avoided tags
  const validNodeIds = new Set(
    graph.nodes
      .filter((node) => !node.tags.some((tag) => avoidTags.includes(tag)))
      .map((node) => node.id)
  );

  // Check if start/end are valid
  if (!validNodeIds.has(startNodeId) || !validNodeIds.has(endNodeId)) {
    console.warn('Start or end node is filtered out or does not exist');
    return null;
  }

  // Filter edges to only include valid nodes
  const validEdges = graph.edges.filter(
    (edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
  );

  // Build adjacency list
  const adjacency: Record<string, { nodeId: string; weight: number }[]> = {};
  
  validNodeIds.forEach((nodeId) => {
    adjacency[nodeId] = [];
  });

  validEdges.forEach((edge) => {
    // Bidirectional edges
    adjacency[edge.source].push({ nodeId: edge.target, weight: edge.weight });
    adjacency[edge.target].push({ nodeId: edge.source, weight: edge.weight });
  });

  // Dijkstra's algorithm
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set(validNodeIds);

  // Initialize distances
  validNodeIds.forEach((nodeId) => {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
  });
  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let currentNode: string | null = null;
    let minDistance = Infinity;

    unvisited.forEach((nodeId) => {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentNode = nodeId;
      }
    });

    if (currentNode === null || minDistance === Infinity) {
      // No path exists
      break;
    }

    // Found the end node
    if (currentNode === endNodeId) {
      break;
    }

    unvisited.delete(currentNode);

    // Update distances to neighbors
    adjacency[currentNode].forEach(({ nodeId, weight }) => {
      if (unvisited.has(nodeId)) {
        const alt = distances[currentNode!] + weight;
        if (alt < distances[nodeId]) {
          distances[nodeId] = alt;
          previous[nodeId] = currentNode;
        }
      }
    });
  }

  // Reconstruct path
  if (distances[endNodeId] === Infinity) {
    return null; // No path found
  }

  const path: string[] = [];
  let current: string | null = endNodeId;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  // Get full node objects
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const nodes = path.map((id) => nodeMap.get(id)!);

  return {
    path,
    distance: distances[endNodeId],
    nodes,
  };
}

/**
 * Find all possible paths and return the shortest
 */
export function findShortestPath(
  graph: RouteGraph,
  startNodeId: string,
  endNodeId: string,
  avoidTags: string[] = []
): DijkstraResult | null {
  return findPath(graph, startNodeId, endNodeId, avoidTags);
}

/**
 * Log path finding results
 */
export function logPathResult(
  result: DijkstraResult | null,
  avoidTags: string[]
) {
  if (!result) {
    console.log('❌ No path found');
    if (avoidTags.length > 0) {
      console.log(`   (Avoiding tags: ${avoidTags.join(', ')})`);
    }
    return;
  }

  console.log('✅ Path found!');
  console.log(`   Distance: ${result.distance.toFixed(2)}m`);
  console.log(`   Steps: ${result.nodes.length} nodes`);
  console.log('   Path:', result.path);
  console.log('   Nodes:', result.nodes);
  
  if (avoidTags.length > 0) {
    console.log(`   ✓ Avoided: ${avoidTags.join(', ')}`);
  }
}
